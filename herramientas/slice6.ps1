param([string]$Src, [string]$OutDir, [string]$Names, [int]$R = 3)
Add-Type -AssemblyName System.Drawing
$code = @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class Slicer6 {
  public static string Run(string src, string outDir, string[] names, int R) {
    Bitmap bmp0 = new Bitmap(src);
    int w = bmp0.Width, h = bmp0.Height;
    Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(bmp)) g.DrawImage(bmp0, 0, 0, w, h);
    BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    byte[] px = new byte[w * h * 4]; Marshal.Copy(d.Scan0, px, 0, px.Length);
    int[] lum = new int[w * h];
    for (int i = 0; i < w * h; i++) lum[i] = (px[i*4+2]*299 + px[i*4+1]*587 + px[i*4]*114) / 1000;
    const int TH = 14, LO = 28, BR = 85, SOFT = 190;
    // barrier = bright outline pixels dilated by R (closes small gaps in the white outline)
    bool[] bar = new bool[w * h];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) if (lum[y*w+x] >= BR) bar[y*w+x] = true;
    for (int it = 0; it < R; it++) {
      bool[] nb = (bool[])bar.Clone();
      for (int y = 1; y < h-1; y++) for (int x = 1; x < w-1; x++) { int p = y*w+x; if (!bar[p] && (bar[p-1] || bar[p+1] || bar[p-w] || bar[p+w])) nb[p] = true; }
      bar = nb;
    }
    bool[] bg = new bool[w * h];
    Queue<int> q = new Queue<int>();
    for (int x = 0; x < w; x++) { q.Enqueue(x); q.Enqueue((h-1)*w + x); }
    for (int y = 0; y < h; y++) { q.Enqueue(y*w); q.Enqueue(y*w + w-1); }
    while (q.Count > 0) {
      int p = q.Dequeue(); if (bg[p] || bar[p] || lum[p] >= TH) continue; bg[p] = true;
      int x = p % w, y = p / w;
      if (x > 0) q.Enqueue(p-1); if (x < w-1) q.Enqueue(p+1); if (y > 0) q.Enqueue(p-w); if (y < h-1) q.Enqueue(p+w);
    }
    // grow background back by R+1 into dark pixels (the ring just outside the outline)
    for (int it = 0; it < R + 1; it++) {
      bool[] nb = (bool[])bg.Clone();
      for (int y = 1; y < h-1; y++) for (int x = 1; x < w-1; x++) { int p = y*w+x; if (!bg[p] && lum[p] < TH && (bg[p-1] || bg[p+1] || bg[p-w] || bg[p+w])) nb[p] = true; }
      bg = nb;
    }
    for (int it = 0; it < 5; it++) { bool[] nb = (bool[])bg.Clone(); for (int y = 1; y < h-1; y++) for (int x = 1; x < w-1; x++) { int p = y*w+x; if (!bg[p] && lum[p] < SOFT && (bg[p-1] || bg[p+1] || bg[p-w] || bg[p+w])) nb[p] = true; } bg = nb; }
    for (int i = 0; i < w * h; i++) if (bg[i]) {
      int a = lum[i] < LO ? 0 : Math.Min(255, (lum[i]-LO)*255/(SOFT-LO));
      px[i*4] = 255; px[i*4+1] = 255; px[i*4+2] = 255; px[i*4+3] = (byte)a;
    }
    int[] lab = new int[w * h]; List<int[]> comps = new List<int[]>();
    for (int s = 0; s < w * h; s++) {
      if (bg[s] || lab[s] != 0) continue;
      int id = comps.Count + 1; int minx = w, miny = h, maxx = 0, maxy = 0, area = 0;
      q.Enqueue(s); lab[s] = id;
      while (q.Count > 0) {
        int p = q.Dequeue(); int x = p % w, y = p / w; area++;
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
        for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
          int nx = x+dx, ny = y+dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          int n = ny*w + nx; if (!bg[n] && lab[n] == 0) { lab[n] = id; q.Enqueue(n); }
        }
      }
      comps.Add(new int[] { minx, miny, maxx, maxy, area, id });
    }
    string rep = w + "x" + h + " comps=" + comps.Count + "\n";
    comps.RemoveAll(c => c[4] < 3000);
    comps.Sort((a, b) => {
      int ra = ((a[1]+a[3])/2) * 4 / h, rb = ((b[1]+b[3])/2) * 4 / h;
      if (ra != rb) return ra.CompareTo(rb);
      return (a[0]+a[2]).CompareTo(b[0]+b[2]);
    });
    // erase pixels of other (small) components so stray bits do not show up in crops
    HashSet<int> keep = new HashSet<int>(); foreach (int[] c in comps) keep.Add(c[5]);
    for (int i = 0; i < w * h; i++) if (!bg[i] && !keep.Contains(lab[i])) px[i*4+3] = 0;
    Marshal.Copy(px, 0, d.Scan0, px.Length); bmp.UnlockBits(d);
    int pad = 4;
    for (int i = 0; i < comps.Count && i < names.Length; i++) {
      int[] c = comps[i];
      int x0 = Math.Max(0, c[0]-pad), y0 = Math.Max(0, c[1]-pad), x1 = Math.Min(w-1, c[2]+pad), y1 = Math.Min(h-1, c[3]+pad);
      Rectangle r = new Rectangle(x0, y0, x1-x0+1, y1-y0+1);
      using (Bitmap crop = bmp.Clone(r, PixelFormat.Format32bppArgb)) crop.Save(System.IO.Path.Combine(outDir, names[i] + ".png"), ImageFormat.Png);
      rep += names[i] + " " + r.X + "," + r.Y + " " + r.Width + "x" + r.Height + " area=" + c[4] + "\n";
    }
    return rep;
  }
}
'@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
New-Item -ItemType Directory -Force $OutDir | Out-Null
[Slicer6]::Run($Src, $OutDir, $Names.Split(','), $R)
