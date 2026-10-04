/* Paleta de los objetos 3D. Mantener sincronizada con src/styles/tokens.css. */
export const PAL = {
  dark: {
    body: 0x2b2b30,      // cuerpo de objetos
    body2: 0x202024,     // cuerpo secundario
    top: 0x3a3a41,       // caras superiores / detalles
    inset: 0x18181b,     // pantallas apagadas, huecos
    ink: 0xf2f0eb,       // detalles claros
    mute: 0x55555c,      // acentos apagados
    line: 0x4a4a51,      // líneas inactivas
    signal: 0x5ba8ff,    // datos / petición
    ok: 0x4cc38a,        // respuesta / completado
    shadow: 0.6,
    glow: true,
    label: '',
  },
  light: {
    body: 0xfdfcfa,
    body2: 0xe8e3d9,
    top: 0xf3efe8,
    inset: 0xdcd6ca,
    ink: 0x161616,
    mute: 0xbdb6a8,
    line: 0xb4ad9f,
    signal: 0x1a4fe0,
    ok: 0x1b7a51,
    shadow: 0.2,
    glow: false,
    label: 'on-light',
  },
};
