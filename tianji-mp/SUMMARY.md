# Tianji MP (Conversion from React)

This project is a UniApp (Vue 3 + TypeScript + Vite) port of the Tianji Bazi application, designed for WeChat Mini Programs.

## Project Structure

- `src/pages/index/index.vue`: Main application entry, containing the profile manager and tab view.
- `src/components/`: Ported Vue components.
  - `BaziChart.vue`
  - `ElementalChart.vue`
  - `Timeline.vue`
  - `ShenShaTable.vue`
  - `ZodiacAnalysis.vue`
- `src/services/`: Logic layers adapted for UniApp.
  - `storageService.ts`: Uses `uni.getStorageSync`.
  - `cityService.ts`: Uses `uni.request` and static JSON.
  - `astrologyService.ts`: Core Bazi logic (lunar-javascript).

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Dev Mode (H5)**:
   ```bash
   npm run dev:h5
   ```

3. **Build for WeChat Mini Program**:
   ```bash
   npm run build:mp-weixin
   ```

4. **Import to Developer Tools**:
   Open "WeChat DevTools" and import the directory `dist/build/mp-weixin`.

## Notes

- **AI Chat**: The AI Chat feature is currently a placeholder (`activeTab === 'ai_chat'`).
- **Icons**: Simplified to text/emoji or CSS shapes to minimize dependency issues in the initial port.
- **Charts**: Recharts was replaced with CSS-based implementation (`ElementalChart`).
