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
    display: flex;
    width: 100%;
    position: relative;
    //display: contents;
    //position: absolute;
  }


  /* slide right animation */
  .slide-right-enter {
    transform: translate(100vw, 0);
  }
  .slide-right-enter.slide-right-enter-active {
    transform: translate(0, 0);
    transition: transform 0.8s ease;
  }
  .slide-right-exit {
    transform: translate(0, 0);
  }
  .slide-right-exit.slide-right-exit-active {
    transform: translate(100vw, 0);
    transition: transform .8s ease;
  }



  .fade-appear, .fade-enter {
    opacity: 0;
  }

  .fade-appear-active, .fade-enter-active {
    transition: opacity 1s linear;
    transition-delay: 1s;
    opacity: 1;
  }

  .fade-exit {
    transition: opacity 1s linear;
    opacity: 1;
  }

  .fade-exit-active {
    opacity: 0;
  }
`
