/* GPU bridge: imports the Direct3D11 shared texture of an Electron offscreen frame (NT handle owned by another process) and copies it,
   GPU -> GPU, into a CUDA device buffer (e.g. a torch tensor). Nothing is read back to the CPU except a few marker pixels (see below).
   The CUDA driver API is loaded from nvcuda.dll at run time (no CUDA toolkit is needed to build this).
   Build: tools/gpu/build_bridge.bat   Used from Python with ctypes (tools/gpu/gpu_bridge.py). */
#include <windows.h>
#include <d3d11_1.h>
#include <dxgi1_2.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <mutex>
#include <map>

#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dxgi.lib")

typedef int CUresult;
typedef int CUdevice;
typedef void *CUcontext, *CUstream, *CUarray, *CUgraphicsResource;
typedef unsigned long long CUdeviceptr;
struct CUDA_MEMCPY2D {
  size_t srcXInBytes, srcY; int srcMemoryType; const void *srcHost; CUdeviceptr srcDevice; CUarray srcArray; size_t srcPitch;
  size_t dstXInBytes, dstY; int dstMemoryType; void *dstHost; CUdeviceptr dstDevice; CUarray dstArray; size_t dstPitch;
  size_t WidthInBytes, Height;
};
#define CUAPI __stdcall
static CUresult(CUAPI *p_cuInit)(unsigned);
static CUresult(CUAPI *p_cuCtxGetCurrent)(CUcontext *);
static CUresult(CUAPI *p_cuCtxSetCurrent)(CUcontext);
static CUresult(CUAPI *p_cuD3D11GetDevice)(CUdevice *, IDXGIAdapter *);
static CUresult(CUAPI *p_cuGraphicsD3D11RegisterResource)(CUgraphicsResource *, ID3D11Resource *, unsigned);
static CUresult(CUAPI *p_cuGraphicsMapResources)(unsigned, CUgraphicsResource *, CUstream);
static CUresult(CUAPI *p_cuGraphicsUnmapResources)(unsigned, CUgraphicsResource *, CUstream);
static CUresult(CUAPI *p_cuGraphicsSubResourceGetMappedArray)(CUarray *, CUgraphicsResource, unsigned, unsigned);
static CUresult(CUAPI *p_cuMemcpy2DAsync)(const CUDA_MEMCPY2D *, CUstream);
static CUresult(CUAPI *p_cuStreamCreate)(CUstream *, unsigned);
static CUresult(CUAPI *p_cuStreamSynchronize)(CUstream);

static std::mutex g_mu;
static char g_err[512];
static ID3D11Device1 *g_dev;
static ID3D11DeviceContext *g_ctx;
static ID3D11Texture2D *g_stage, *g_mark;   /* g_stage: persistent copy registered with CUDA; g_mark: CPU-readable strip of marker pixels */
static CUgraphicsResource g_res;
static CUcontext g_cuctx;
static CUstream g_stream;
static int g_w, g_h, g_markRows;
static std::map<DWORD, HANDLE> g_procs;
static unsigned long long g_nImport;

#define FAIL(...) do { snprintf(g_err, sizeof g_err, __VA_ARGS__); return -1; } while (0)

extern "C" __declspec(dllexport) const char *br_last_error() { return g_err; }

/* w x h = size of the shared texture (the page viewport incl. the marker rows); the CUDA context of the calling thread is the one used later */
extern "C" __declspec(dllexport) int br_init(int w, int h, int markRows, int cudaOrdinal) {
  std::lock_guard<std::mutex> lk(g_mu);
  HMODULE cu = LoadLibraryA("nvcuda.dll");
  if (!cu) FAIL("nvcuda.dll not found");
#define L(n) if (!(*(FARPROC *)&p_##n = GetProcAddress(cu, #n))) FAIL("missing " #n)
  L(cuInit); L(cuCtxGetCurrent); L(cuCtxSetCurrent); L(cuD3D11GetDevice); L(cuGraphicsD3D11RegisterResource); L(cuGraphicsMapResources);
  L(cuGraphicsUnmapResources); L(cuGraphicsSubResourceGetMappedArray); L(cuStreamCreate); L(cuStreamSynchronize);
  if (!(*(FARPROC *)&p_cuMemcpy2DAsync = GetProcAddress(cu, "cuMemcpy2DAsync_v2"))) FAIL("missing cuMemcpy2DAsync_v2");
  p_cuInit(0);
  if (p_cuCtxGetCurrent(&g_cuctx) != 0 || !g_cuctx) FAIL("no current CUDA context (touch torch.cuda first)");
  /* the DXGI adapter that is CUDA device `cudaOrdinal` */
  IDXGIFactory1 *fac = nullptr;
  if (FAILED(CreateDXGIFactory1(__uuidof(IDXGIFactory1), (void **)&fac))) FAIL("CreateDXGIFactory1");
  IDXGIAdapter *ad = nullptr, *pick = nullptr;
  for (UINT i = 0; fac->EnumAdapters(i, &ad) == S_OK; i++) {
    CUdevice d = -1;
    if (p_cuD3D11GetDevice(&d, ad) == 0 && d == cudaOrdinal) { pick = ad; break; }
    ad->Release();
  }
  fac->Release();
  if (!pick) FAIL("no DXGI adapter for CUDA device %d", cudaOrdinal);
  DXGI_ADAPTER_DESC desc; pick->GetDesc(&desc);
  ID3D11Device *d0 = nullptr; ID3D11DeviceContext *c0 = nullptr;
  D3D_FEATURE_LEVEL fl[] = {D3D_FEATURE_LEVEL_11_1, D3D_FEATURE_LEVEL_11_0}, got;
  HRESULT hr = D3D11CreateDevice(pick, D3D_DRIVER_TYPE_UNKNOWN, nullptr, D3D11_CREATE_DEVICE_BGRA_SUPPORT, fl, 2, D3D11_SDK_VERSION, &d0, &got, &c0);
  pick->Release();
  if (FAILED(hr)) FAIL("D3D11CreateDevice 0x%08lx", hr);
  if (FAILED(d0->QueryInterface(__uuidof(ID3D11Device1), (void **)&g_dev))) FAIL("ID3D11Device1");
  d0->Release(); g_ctx = c0;
  g_w = w; g_h = h; g_markRows = markRows;
  D3D11_TEXTURE2D_DESC td = {};
  td.Width = w; td.Height = h; td.MipLevels = 1; td.ArraySize = 1; td.Format = DXGI_FORMAT_B8G8R8A8_UNORM; td.SampleDesc.Count = 1; td.Usage = D3D11_USAGE_DEFAULT;
  td.BindFlags = D3D11_BIND_SHADER_RESOURCE;
  if (FAILED(g_dev->CreateTexture2D(&td, nullptr, &g_stage))) FAIL("stage texture");
  td.Width = 512; td.Height = markRows > 0 ? markRows : 1; td.Usage = D3D11_USAGE_STAGING; td.BindFlags = 0; td.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
  if (FAILED(g_dev->CreateTexture2D(&td, nullptr, &g_mark))) FAIL("marker texture");
  CUresult r = p_cuGraphicsD3D11RegisterResource(&g_res, g_stage, 0);
  if (r) FAIL("cuGraphicsD3D11RegisterResource failed (%d)", r);
  if (p_cuStreamCreate(&g_stream, 1)) FAIL("cuStreamCreate");
  snprintf(g_err, sizeof g_err, "ok adapter=%ls", desc.Description);
  return 0;
}

/* Copies the shared texture (NT handle `handle` valid in process `pid`) into the CUDA buffer `dst` (pitch bytes per row, BGRA, premultiplied alpha
   as Chromium paints it) and decodes the frame marker (32 black/white cells, 16 px wide, in the first `markRows` rows below the picture). */
extern "C" __declspec(dllexport) int br_import(int pid, unsigned long long handle, unsigned long long dst, int pitch, unsigned int *marker) {
  std::lock_guard<std::mutex> lk(g_mu);
  p_cuCtxSetCurrent(g_cuctx);
  HANDLE hp;
  auto it = g_procs.find((DWORD)pid);
  if (it == g_procs.end()) {
    hp = OpenProcess(PROCESS_DUP_HANDLE, FALSE, (DWORD)pid);
    if (!hp) FAIL("OpenProcess(%d) err %lu", pid, GetLastError());
    g_procs[(DWORD)pid] = hp;
  } else hp = it->second;
  HANDLE local = nullptr;
  if (!DuplicateHandle(hp, (HANDLE)handle, GetCurrentProcess(), &local, 0, FALSE, DUPLICATE_SAME_ACCESS)) FAIL("DuplicateHandle err %lu", GetLastError());
  ID3D11Texture2D *tex = nullptr;
  HRESULT hr = g_dev->OpenSharedResource1(local, __uuidof(ID3D11Texture2D), (void **)&tex);
  CloseHandle(local);
  if (FAILED(hr)) FAIL("OpenSharedResource1 0x%08lx", hr);
  D3D11_TEXTURE2D_DESC d; tex->GetDesc(&d);
  if ((int)d.Width != g_w || (int)d.Height != g_h) { int w = d.Width, h = d.Height; tex->Release(); FAIL("shared texture is %dx%d, expected %dx%d", w, h, g_w, g_h); }
  IDXGIKeyedMutex *km = nullptr;
  tex->QueryInterface(__uuidof(IDXGIKeyedMutex), (void **)&km);
  if (km) { hr = km->AcquireSync(0, 2000); if (FAILED(hr) || hr == WAIT_TIMEOUT) { km->Release(); tex->Release(); FAIL("AcquireSync 0x%08lx", hr); } }
  g_ctx->CopyResource(g_stage, tex);
  /* the marker strip goes to a CPU-readable staging texture (a few KB); Map() also waits for the copy above to finish on the GPU */
  unsigned int mk = 0xFFFFFFFFu;
  if (g_markRows > 0) {
    D3D11_BOX box = {0, (UINT)(g_h - g_markRows), 0, 512, (UINT)g_h, 1};
    g_ctx->CopySubresourceRegion(g_mark, 0, 0, 0, 0, g_stage, 0, &box);
    D3D11_MAPPED_SUBRESOURCE m;
    if (SUCCEEDED(g_ctx->Map(g_mark, 0, D3D11_MAP_READ, 0, &m))) {
      const unsigned char *row = (const unsigned char *)m.pData + (size_t)m.RowPitch * (g_markRows / 2);
      mk = 0;
      for (int i = 0; i < 32; i++) { const unsigned char *px = row + (i * 16 + 8) * 4; if ((px[0] + px[1] + px[2]) > 3 * 128) mk |= 1u << i; }
      g_ctx->Unmap(g_mark, 0);
    }
  } else g_ctx->Flush();
  if (km) { km->ReleaseSync(0); km->Release(); }
  tex->Release();
  if (marker) *marker = mk;
  /* GPU -> GPU into the caller's CUDA buffer */
  CUarray arr = nullptr;
  if (p_cuGraphicsMapResources(1, &g_res, g_stream)) FAIL("cuGraphicsMapResources");
  if (p_cuGraphicsSubResourceGetMappedArray(&arr, g_res, 0, 0)) { p_cuGraphicsUnmapResources(1, &g_res, g_stream); FAIL("cuGraphicsSubResourceGetMappedArray"); }
  CUDA_MEMCPY2D c; memset(&c, 0, sizeof c);
  c.srcMemoryType = 3; c.srcArray = arr; c.dstMemoryType = 2; c.dstDevice = dst; c.dstPitch = pitch; c.WidthInBytes = (size_t)g_w * 4; c.Height = (size_t)g_h;
  CUresult r = p_cuMemcpy2DAsync(&c, g_stream);
  p_cuStreamSynchronize(g_stream);
  p_cuGraphicsUnmapResources(1, &g_res, g_stream);
  if (r) FAIL("cuMemcpy2DAsync %d", r);
  g_nImport++;
  return 0;
}

extern "C" __declspec(dllexport) unsigned long long br_count() { return g_nImport; }
