// We've set up this sample using CSS modules, which lets you import class
// names into JavaScript: https://github.com/css-modules/css-modules
// You can configure or change this in the webpack.config.js file.
import * as styles from './style.css'; // Renamed to 'styles' for clarity
import type { RendererContext } from 'vscode-notebook-renderer';

interface IRenderInfo {
  container: HTMLElement;
  mime: string;
  value: any;
  context: RendererContext<unknown>;
}

// This function is called to render your contents.
// The extension calls this with an IRenderInfo object.
export function render({ container, mime, value, context }: IRenderInfo) {
    const renderer = new ClientSideRenderer(context, container);
    renderer.renderData(value, container, mime);
}

class ClientSideRenderer {
    private readonly _context: RendererContext<unknown>;
    private readonly _container: HTMLElement;

    constructor(context: RendererContext<unknown>, container: HTMLElement) {
        this._context = context;
        this._container = container;
        container.classList.add(styles.container); // Add base container styling
    }

    public renderData(data: any, container: HTMLElement, mime: string): void {
        container.innerHTML = ''; // Clear previous content

        switch (mime) {
            case 'x-application/custom-json-output': // Existing MIME type
            case 'application/vnd.code.notebook.my-custom-json':
                this.renderUnknown(container, data); // JSON can be rendered as unknown for now
                break;
            case 'application/vnd.code.notebook.my-custom-html':
                this.renderHtml(container, data);
                break;
            case 'application/vnd.code.notebook.my-custom-table': // Assuming this MIME type for tables
                this.renderTable(container, data);
                break;
            case 'application/vnd.code.notebook.my-custom-chart': // Assuming this MIME type for charts
                this.renderChart(container, data);
                break;
            default:
                this.renderUnknown(container, data);
                break;
        }
    }

    // The snippet with the error
    private renderTable(container: HTMLElement, data: any): void {
        if (!Array.isArray(data.rows)) { // Fix: Added 'if (!' and removed extra ')'
            this.renderError(container, 'Invalid table data');
            return;
        }

        const headers = data.headers ?
            `<thead><tr>${data.headers.map((h: string) => `<th>${h}</th>`).join('')}</tr></thead>` : '';

        const rows = data.rows.map((row: any[]) =>
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('');

        container.innerHTML = `
            <div class="${styles.tableContainer}">
                <table class="${styles.table}">
                    ${headers}
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    private renderHtml(container: HTMLElement, data: any): void {
        container.innerHTML = data.content || data.html || '';
    }

    private renderUnknown(container: HTMLElement, data: any): void {
        container.innerHTML = `
            <div class="${styles.unknown}">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    }

    private renderError(container: HTMLElement, message: string): void {
        container.innerHTML = `
            <div class="${styles.error}">
                <strong>Error:</strong> ${message}
            </div>
        `;
    }

    // Adding renderChart method based on generateChartSvg
    private renderChart(container: HTMLElement, data: any): void {
        const svg = this.generateChartSvg(data);
        container.innerHTML = `
            <div class="${styles.chart}">
                <h3>Chart</h3>
                <div class="${styles.chartContent}">
                    ${svg}
                </div>
            </div>
        `;
    }


    private generateChartSvg(data: any): string {
        // Simple SVG chart generation
        const values = data.values || [];
        const maxValue = Math.max(...values, 1);
        const points = values.map((val: number, i: number) =>
            `${i * 50},${100 - (val / maxValue) * 90}`
        ).join(' ');

        return `
            <svg width="400" height="120" viewBox="0 0 400 120">
                <polyline points="${points}" fill="none" stroke="#0078d4" stroke-width="2"/>
                ${values.map((val: number, i: number) =>
                    `<circle cx="${i * 50}" cy="${100 - (val / maxValue) * 90}" r="3" fill="#0078d4"/>`
                ).join('')}
            </svg>
        `;
    }

    private cleanup(container: HTMLElement): void {
        // Clean up any event listeners, intervals, etc.
        container.innerHTML = '';
    }
}

if (module.hot) {
  module.hot.addDisposeHandler(() => {
    // In development, this will be called before the renderer is reloaded. You
    // can use this to clean up or stash any state.
  });
}