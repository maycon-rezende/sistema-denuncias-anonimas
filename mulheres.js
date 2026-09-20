document.addEventListener('DOMContentLoaded', () => {
  const saida = () => {
    document.title = 'Informações gerais';
    document.body.innerHTML = '<main style="min-height:100vh;background:#fff"></main>';
    window.location.replace('about:blank');
  };
  document.getElementById('saida-rapida').addEventListener('click', saida);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') saida();
  });
});