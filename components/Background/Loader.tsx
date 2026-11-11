// The dark screen over the page on its first load, until the 3D scene is
// ready: as dark as the inside of the head's mouth the camera then comes out
// of (intro.ts). Its spinner is a thin ring in the dawn sky's colours, the
// theme's light, peach and rose (theme/head.json) fading to nothing at its
// tail, on a faint track. It and the screen fade once the scene is ready
// (data-intro on <html>); as the camera comes out of the mouth ("fly"),
// they wait 0.75 seconds over its dark inside and fade over the next second,
// as the camera creeps out past the lips (intro.ts), so the face comes in
// as the spinner goes. Faded, its "Loading" status is hidden too
// (visibility, which turns at the end of the fade), so a screen reader does
// not meet it on every page.
export default function Loader() {
  return (
    <div
      data-loader
      className="fixed inset-0 z-[100] flex items-center justify-center bg-head-dark transition-opacity duration-700 ease-out [html[data-intro=fly]_&]:delay-[750ms] [html[data-intro=fly]_&]:duration-1000 [html[data-intro]_&]:pointer-events-none [html[data-intro]_&]:opacity-0"
    >
      <div
        role="status"
        aria-label="Loading"
        className="relative size-20 transition-[opacity,visibility] duration-300 [html[data-intro=fly]_&]:delay-[750ms] [html[data-intro=fly]_&]:duration-700 [html[data-intro]_&]:invisible [html[data-intro]_&]:opacity-0"
      >
        <div className="absolute inset-0 rounded-full border-2 border-head-light/10" />
        <div className="absolute inset-0 animate-[spin_1.4s_linear_infinite] rounded-full bg-[conic-gradient(transparent_35%,theme(colors.head.rose)_65%,theme(colors.head.peach)_85%,theme(colors.head.light))] [mask:radial-gradient(farthest-side,transparent_calc(100%_-_3px),#000_calc(100%_-_2px))]" />
      </div>
    </div>
  );
}
