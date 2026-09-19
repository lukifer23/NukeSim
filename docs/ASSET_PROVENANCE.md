# Asset provenance

All third-party visual assets are packaged locally. NukeSim performs no runtime CDN fetches.

## Poly Haven CC0 materials

License: [CC0](https://polyhaven.com/license). Original 1K JPEG maps are used without generative alteration; filenames were normalized for application use.

| Application files | Source | Creator | SHA-256 |
| --- | --- | --- | --- |
| `concrete-diffuse.jpg` | [Concrete](https://polyhaven.com/a/concrete) | Rob Tuytel | `046c0e2aebe31e6043a6bc074e779f6a345f1d823d0ca1c69446c5cabadefa8a` |
| `concrete-normal.jpg` | [Concrete](https://polyhaven.com/a/concrete) | Rob Tuytel | `298a0e93040c9d76d239a894bdf28a9787755ea5f22baa068ffa8075369ee428` |
| `concrete-arm.jpg` | [Concrete](https://polyhaven.com/a/concrete) | Rob Tuytel | `98bd4ffb8ec52620b1053f6f576f1154caf20ee7a8786721724ea169b16582e0` |
| `brick-wall-diffuse.jpg` | [Brick Wall 08](https://polyhaven.com/a/brick_wall_08) | Amal Kumar | `e20bb6a284e612c4b3fd67e501fb1578705de3559872434e98be832c42671b85` |
| `brick-wall-normal.jpg` | [Brick Wall 08](https://polyhaven.com/a/brick_wall_08) | Amal Kumar | `d35e7be27c840ba20d68d10276a5954190ec5a3b2d8c8fd6672a6f7c6386e1df` |
| `brick-wall-arm.jpg` | [Brick Wall 08](https://polyhaven.com/a/brick_wall_08) | Amal Kumar | `c8ed72a7e05da500b4ed89cbbf8676b9be9d94be815b3008f81dc70b6e1b0759` |
| `concrete-floor-diffuse.jpg` | [Concrete Floor 01](https://polyhaven.com/a/concrete_floor_01) | Rob Tuytel | `db7c800f1464359b5f359fc743e82ac51b34e014fdfd53844f4af34bb1949229` |
| `concrete-floor-normal.jpg` | [Concrete Floor 01](https://polyhaven.com/a/concrete_floor_01) | Rob Tuytel | `28be1f6fa82eeab137c84954bf7ea0f5d8a4434352d01c29f15e20926eb7227e` |
| `concrete-floor-arm.jpg` | [Concrete Floor 01](https://polyhaven.com/a/concrete_floor_01) | Rob Tuytel | `44e3a0d18db295998c8af56ecc80095821e719e134974609aa92e5436709dabd` |

Combined packaged size is approximately 5 MiB, below the enforced 6 MiB initial texture budget. `npm run check:assets` measures every file under `public/assets` and fails the release gate when that ceiling is exceeded.

## IBM Plex fonts (SIL Open Font License 1.1)

Self-hosted under `public/fonts` so the app performs no runtime CDN fetches. Latin subsets of IBM Plex Sans (400/500/600/700) and IBM Plex Mono (400/500/600), pulled from the Google Fonts CSS API and written unmodified as `.woff2`. Total ~196 KiB; fonts are excluded from the visual-texture budget above.
