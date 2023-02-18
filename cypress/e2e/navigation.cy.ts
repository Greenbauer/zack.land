export default describe('Navigation', () => {
  const url = 'http://localhost:3000';

  function goToNav(href: string) {
    cy.get(`.navbar a[href="${href}"]`).click();
    cy.url().should('include', href);
  }

  beforeEach('should navigate to the portfolio page', () => {
    cy.visit(url);
  });

  it('should navigate the entire app', () => {
    goToNav('/portfolio');
    cy.get('.navbar h5').contains('Portfolio');

    // web apps
    cy.get('li a[href*="/portfolio/web-apps"]').click();

    cy.get('.navbar h5').contains('Web Apps');
    cy.get('.section').should('exist');

    // art
    goToNav('/portfolio');
    cy.get('li a[href*="/portfolio/art"]').click();

    cy.get('.navbar h5').contains('Digital Art');
    cy.get('.card').should('exist');

    // misc
    goToNav('/portfolio');
    cy.get('li a[href*="/portfolio/miscellaneous"]').click();

    cy.get('.navbar h5').contains('Miscellaneous');
    cy.get('.section').should('exist');

    // contact
    goToNav('/contact');

    cy.get('.navbar h5').contains('Contact Me');
    cy.get('form label').contains('Name');
    cy.get('form button[type="submit"]').should('be.disabled');
    cy.get('footer').contains('Please fill out this form');

    // home
    goToNav('/');

    cy.get('.navbar h5').should('not.exist');
    cy.get('h1').contains('Zack Greenbauer');
    cy.get('footer').contains('Contact me.');

    // 404
    cy.visit(`${url}/404`, { failOnStatusCode: false });
    cy.get('video').should('exist');

    cy.get('body').contains('Page not found');
  });
});
