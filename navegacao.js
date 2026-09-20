document.addEventListener('DOMContentLoaded', () => {
  const botao = document.querySelector('.menu-mobile-toggle');
  const menu = document.getElementById('menu-principal');
  if (!botao || !menu) return;

  const fechar = () => {
    menu.classList.remove('is-open');
    botao.classList.remove('is-open');
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', 'Abrir menu');
  };
  botao.addEventListener('click', () => {
    const aberto = menu.classList.toggle('is-open');
    botao.classList.toggle('is-open', aberto);
    botao.setAttribute('aria-expanded', String(aberto));
    botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', fechar));
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !botao.contains(event.target)) fechar();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') fechar();
  });
});
