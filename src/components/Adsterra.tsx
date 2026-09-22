"use client";

export function AdsterraNative() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>body { margin: 0; padding: 0; background: transparent; }</style>
      </head>
      <body>
        <script async="async" data-cfasync="false" src="//pl31363078.profitableratecpmnetwork.com/cdc0c90b2992b79a81c23be15bd6d3ea/invoke.js"></script>
        <div id="contenedor-cdc0c90b2992b79a81c23be15bd6d3ea"></div>
      </body>
    </html>
  `;
  return (
    <div className="w-full flex justify-center my-6 min-h-[150px]">
      <iframe 
        srcDoc={html} 
        width="100%" 
        height="100%" 
        style={{ minHeight: '250px' }}
        frameBorder="0" 
        scrolling="no" 
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Adsterra Native"
      />
    </div>
  );
}

export function AdsterraBanner300() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>body { margin: 0; padding: 0; display: flex; justify-content: center; background: transparent; }</style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : 'a135250a082e4273d22307c9d7e5b016',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="//www.highrevenueformat.com/a135250a082e4273d22307c9d7e5b016/invoke.js"></script>
      </body>
    </html>
  `;
  return (
    <div className="w-full flex justify-center my-4 overflow-hidden min-h-[250px]">
      <iframe 
        srcDoc={html} 
        width="300" 
        height="250" 
        frameBorder="0" 
        scrolling="no" 
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Adsterra 300x250"
      />
    </div>
  );
}
