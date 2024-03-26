describe('injectImportAndFillMetadata', () => {
  const testContent = document.createElement('div');

  beforeAll(() => {
    testContent.id = 'test-content';
    document.body.appendChild(testContent);
  });

  beforeEach(async () => {
    const response = await fetch('/base/src/app/testdata/new_work_page.html');
    const text = await response.text();
    testContent.innerHTML = text;
  });

  afterEach(() => {
    testContent.innerHTML = '';
  });

  it('shows the new work page', () => {
    const header = testContent.querySelector('h2');

    expect(header?.textContent).toBe('Post New Work');
  });
});
