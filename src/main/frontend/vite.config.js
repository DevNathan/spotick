import {defineConfig} from 'vite';
import path from 'path';
import fs from 'fs';
import {fileURLToPath, URL} from 'url';

/**
 * 지정된 디렉토리 내부의 파일들을 재귀적으로 탐색하여 동적 엔트리 포인트를 생성합니다.
 * 하위 폴더 구조를 유지하여 빌드 결과물의 경로를 원본과 동일하게 매핑하기 위해 사용됩니다.
 *
 * @param {string} dir - 탐색을 시작할 최상위 디렉토리의 절대 경로
 * @param {string[]} extensions - 번들링 대상에 포함할 파일 확장자 배열 (예: ['.js', '.ts', '.css'])
 * @param {string} type - 빌드 결과물이 저장될 최상위 폴더명 ('js' 또는 'css')
 * @returns {Record<string, string>} Vite 빌드 설정(rollupOptions)에 주입할 동적 엔트리 포인트 객체
 */
function getEntries(dir, extensions, type) {
    const entries = {};
    if (!fs.existsSync(dir)) return entries;

    const walk = (currentDir, baseDir = '') => {
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walk(fullPath, path.join(baseDir, file));
            } else {
                const ext = path.extname(file);
                if (extensions.includes(ext)) {
                    // 원본 디렉토리 구조를 유지하여 엔트리 키를 생성합니다.
                    const name = path.join(baseDir, path.basename(file, ext));
                    entries[`${type}/${name}`] = fullPath;
                }
            }
        }
    };
    walk(dir);
    return entries;
}

// 'js' 및 'css' 디렉토리 내부의 모든 대상 파일을 스캔하여 엔트리 객체를 통합합니다.
const jsEntries = getEntries(path.resolve(__dirname, 'js'), ['.js', '.ts'], 'js');
const cssEntries = getEntries(path.resolve(__dirname, 'css'), ['.css'], 'css');

const allEntries = {...jsEntries, ...cssEntries};

console.log("[Vite Build Targets]");
console.log(allEntries);

export default defineConfig({
    /**
     * @property {string} base
     * @description Spring Boot 서버가 인식하는 정적 자원의 기본 URL 경로입니다.
     * CSS 내부의 이미지나 폰트 경로가 '/dist/assets/...' 형태로 올바르게 변환되도록 지원합니다.
     */
    base: '/dist/',

    resolve: {
        alias: {
            // 코드 내에서 상대 경로(../../) 대신 절대 경로('@/...')를 사용할 수 있도록 모듈 별칭을 설정합니다.
            '@': fileURLToPath(new URL('./js', import.meta.url))
        }
    },

    build: {
        // Spring Boot의 정적 자원(static) 디렉토리로 빌드 결과물을 직접 출력합니다.
        outDir: '../resources/static/dist',

        // 빌드 실행 전, 이전 빌드의 잔여 파일이 남지 않도록 아웃풋 디렉토리를 비웁니다.
        emptyOutDir: true,

        rollupOptions: {
            input: allEntries,
            output: {
                /**
                 * @description 동적으로 생성된 엔트리 키값([name])을 활용하여 원본 디렉토리 구조를 유지한 채 파일명을 생성합니다.
                 */
                entryFileNames: `[name].min.js`,
                chunkFileNames: `[name].min.js`,

                /**
                 * @description CSS 파일과 기타 에셋(이미지, 폰트 등)의 출력 경로를 분리합니다.
                 * CSS는 원본 폴더 구조를 유지하며 저장하고, 나머지 에셋은 'assets/' 폴더로 일괄 통합합니다.
                 */
                assetFileNames: (assetInfo) => {
                    const name = assetInfo.name || '';
                    if (name.endsWith('.css')) {
                        return `[name].min.[ext]`;
                    }
                    return `assets/[name].[ext]`;
                }
            }
        },
        // 프로덕션 환경에 맞게 CSS 코드를 압축(Minify)하여 최적화 및 용량 절감을 수행합니다.
        cssMinify: true
    }
});