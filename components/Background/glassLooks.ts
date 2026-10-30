// The glass's two looks, as the end of its composite's main() (glass.ts):
// the frosted scene, seen through the lenses; and the tint.
export const frost = `
        float bend = lensed;
        vec2 bent = mix(p, lens(p, box), bend) / uSize;
        vec4 glass = mix(texture2D(tBlur, bent), texture2D(tSmooth, bent), field);
        gl_FragColor = mix(scene, glass, frost);`;
export const tint = `
        if (frost < 0.001) {
          gl_FragColor = scene;
          return;
        }
        vec3 sky = uShare > 0.5 ? skyAround(uShared, true) : skyAround(box, false);
        vec3 tintColour = cardTint(sky, lightness);
        vec3 weights = vec3(0.2126, 0.7152, 0.0722);
        float tinted = pow(dot(pow(tintColour, vec3(2.2)), weights), 1.0 / 2.2);
        float here = pow(dot(pow(scene.rgb, vec3(2.2)), weights), 1.0 / 2.2);
        float want = clamp(here, bounds.x, bounds.y);
        float apart = here - tinted;
        float shift = abs(apart) < 0.0001 ? 0.0 : clamp((here - want) / apart, 0.0, 1.0);
        gl_FragColor = vec4(mix(scene.rgb, tintColour, max(uStrength, shift) * frost), scene.a);`;
