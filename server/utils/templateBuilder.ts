/**
 * Builds a standalone HTML page from generated template code.
 * The output is a self-contained document that renders a React component
 * using CDN-loaded React, ReactDOM, and Babel for JSX transformation.
 */

interface TemplateData {
  tsx_code: string;
  css_code: string;
  font: string;
  font_url: string;
}

interface SettingsData {
  primary_color?: string;
  [key: string]: string | undefined;
}

export function buildTemplateHtml(
  template: TemplateData,
  products: unknown[],
  settings: SettingsData
): string {
  const { tsx_code, css_code, font, font_url } = template;
  const accentColor = settings.primary_color || '#6366f1';

  // Escape closing script tags inside embedded data/code to prevent
  // premature termination of <script> blocks.
  const escapeForScript = (str: string) =>
    str.replace(/<\/script/gi, '<\\/script');

  const productsJson = escapeForScript(JSON.stringify(products));
  const settingsJson = escapeForScript(JSON.stringify(settings));
  const escapedTsx = escapeForScript(tsx_code);

  // Build the Google Font <link> tag if a font_url is provided
  const fontLink = font_url
    ? `<link rel="stylesheet" href="${font_url}" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FAQ</title>

  ${fontLink}

  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    :root {
      --accent: ${accentColor};
      --font-family: '${font}', sans-serif;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: var(--font-family);
    }

    ${css_code}
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    window.__FAQ_PRODUCTS__ = ${productsJson};
    window.__FAQ_SETTINGS__ = ${settingsJson};
  </script>

  <script type="text/babel" data-type="module">
    const products = window.__FAQ_PRODUCTS__;
    const settings = window.__FAQ_SETTINGS__;

    ${escapedTsx}

    const rootEl = document.getElementById('root');
    const root = ReactDOM.createRoot(rootEl);
    root.render(React.createElement(App, { products, settings }));
  </script>
</body>
</html>`;
}
