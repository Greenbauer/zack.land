export default describe('Contact form Submit button', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/contact');
  });

  it('enables Submit once valid, without blurring the last field', () => {
    cy.get('form button[type="submit"]').should('be.disabled');

    cy.get('input[name="name"]').type('Zachary Greenbauer');
    cy.get('input[name="email"]').type('zach@example.com');
    // Type into the last field and deliberately do NOT blur it.
    cy.get('textarea[name="message"]').type('Hello there');

    // Still focused on the message field — the button must already be enabled.
    cy.focused().should('have.attr', 'name', 'message');
    cy.get('form button[type="submit"]').should('not.be.disabled');
  });

  it('shows a field error only after blur, not while typing', () => {
    cy.get('input[name="email"]').type('not-an-email');
    // While the field is still focused, no error text yet.
    cy.contains('small', 'invalid').should('not.exist');

    cy.get('input[name="email"]').blur();
    cy.contains('small', 'invalid').should('be.visible');
  });
});
