import { injectGlobal } from 'styled-components';

/* eslint no-unused-expressions: 0 */
injectGlobal`
  html,
  body {
    min-height: 100%;
    min-width: 100%;
    background: #111111;
    z-index: -1;
    display: flex;
  }

  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;

  }

  body.fontLoaded {
    font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  #app {
    background-color: transparent;
    min-height: 100%;
    min-height: 100vh;
    min-width: 100%;
    position: relative;
    display: flex;
    overflow-x: hidden;
  }

  p,
  label {
    font-size: 18px;
    line-height: 1.5em;
    color: #999999;
  }

  small, .text-muted {
    /*here for ref: dark blue on dark bg rgba(0, 99, 175, 0.8)*/
    color: #777777 !important;
    font-size: 18px;
  }

   a, a span {
    text-decoration: none !important;
    color: rgba(61, 225, 255, 0.7);

    &:hover {
      color: rgba(255, 49, 175, 0.7);
    }
    &:active {
      color: #222222 !important;
    }
    &:focus {
      color: rgba(61, 225, 255, 0.7);
    }
  }

  .form-control {
    font-size: 18px;
  }

  .youtube iframe {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }

  .cover {

    @media (max-width: 767px) {
      text-align: center;
    }
  }



  /* react transition group transitions */

  .transition-group {
    position: relative;
    /*display: flex;
    flex-grow: 1;*/
    width: 100%;
  }

  /*.transition-group > * {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }*/

  /* slideRight animation */

  .slideRight-enter {
    transform: translate(100vw, 0);
  }

  .slideRight-enter.slideRight-enter-active {
    transform: translate(0, 0);
    transition: transform 0.8s ease;
  }

  .slideRight-exit {
    transform: translate(0, 0);
  }

  .slideRight-exit.slideRight-exit-active {
    transform: translate(100vw, 0);
    transition: transform 0.8s ease;
  }

  /* no animation */

  .no-enter {
    transform: translate(0, -100vh);
  }

  .no-enter.no-enter-active {
    transform: translate(0, 0);
    transition: transform 0.8s ease;
  }

  .no-exit {
    transform: translate(0, 0);
  }

  .no-exit.no-exit-active {
    transform: translate(0, -100vh);
    transition: transform 3.8s ease;
    transition-delay: 2s;
  }

  /* fade animation */

  .fade-enter {
    opacity: 0;
  }

  .fade-enter.fade-enter-active {
    opacity: 1;
    transition: opacity 0.3s ease;
    transition-delay: 0.3s;
  }

  .fade-exit {
    opacity: 1;
  }

  .fade-exit.fade-exit-active {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  /* slideRightInner animation */

  .slideRightInner-enter {
    transform: translate(100%, 0);
  }

  .slideRightInner-enter.slideRightInner-enter-active {
    transform: translate(0, 0);
    transition: transform 0.4s ease;
  }

  .slideRightInner-exit {
    transform: translate(0, 0);
  }

  .slideRightInner-exit.slideRightInner-exit-active {
    transform: translate(100%, 0);
    transition: transform 0.4s ease;
  }

`
