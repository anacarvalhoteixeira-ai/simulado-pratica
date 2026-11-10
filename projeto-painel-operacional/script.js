const $ = (id) => document.getElementById(id);
const categorias = ['manutenção', 'operação', 'inspeção'];
const operador = { id: 1, nome: 'Ana Silva' };
let usuario = null;
let filtro = '';
let pagina = 1;
const abertos = new Set();
const registros = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  tipo: categorias[i % 3],
  nome: i % 2 ? 'Carlos Souza' : 'Marina Santos',
  usuarioId: 2,
  metros: 1500 + i * 250,
  minutos: 60 + i * 10,
  eficiencia: 90 + (i % 10),
  data: new Date(2026, 10, 10, 14, 30 - i),
  apoios: new Set(),
  comentarios: [],
}));
const km = (metros) => metros / 1000;
const horas = (minutos) => minutos / 60;
const numero = (valor) => Number(valor.toFixed(2)).toLocaleString('pt-BR');
const seguro = (texto) =>
  String(texto).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
function dataFormatada(data) {
  return `${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
}
function autorizado() {
  if (usuario) return true;
  $('modal').showModal();
  return false;
}
function erro(id, mensagem) {
  $(id).setAttribute('aria-invalid', String(Boolean(mensagem)));
  $(id).setAttribute('aria-describedby', `erro-${id}`);
  $(`erro-${id}`).textContent = mensagem;
}
function mostrarCadastro(abrir) {
  $('cadastro').hidden = !abrir;
  $('listagem').hidden = abrir;
  $('registros').classList.toggle('ativo', abrir);
}
function atualizar() {
  $('autenticacao').textContent = usuario ? 'Logout' : 'Login';
  $('autenticacao').classList.toggle('logado', Boolean(usuario));
  $('registros').disabled = !usuario;
  const individuais = registros.filter((r) => r.usuarioId === usuario?.id);
  $('perfil').innerHTML = usuario
    ? `<div class="operador"><img class="avatar" src="assets/perfil.svg" alt="Foto ilustrativa de ${usuario.nome}"><strong>${usuario.nome}</strong></div><p>Seus apontamentos: ${individuais.length}<br>Suas horas: ${numero(individuais.reduce((s, r) => s + horas(r.minutos), 0))} h</p>`
    : '<p>Visitante<br>Entre para interagir.</p>';
  $('total').textContent = registros.length;
  $('horas').textContent = numero(
    registros.reduce((s, r) => s + horas(r.minutos), 0),
  );
  document
    .querySelectorAll('[data-filtro]')
    .forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro)),
    );
  const lista = registros.filter((r) => !filtro || r.tipo === filtro);
  const paginas = Math.max(1, Math.ceil(lista.length / 4));
  pagina = Math.min(pagina, paginas);
  $('feed').innerHTML =
    lista
      .slice((pagina - 1) * 4, pagina * 4)
      .map(
        (r) => `<article>
    <h3>Apontamento de ${r.tipo}</h3>
    <div class="operador"><img class="avatar" src="assets/perfil.svg" alt="Foto ilustrativa de ${seguro(r.nome)}"><strong>${seguro(r.nome)}</strong></div>
    <p>Deslocamento: ${numero(km(r.metros))} km<br>Tempo de execução: ${numero(horas(r.minutos))} h<br>Eficiência: ${r.eficiencia === null ? 'Não informada' : r.eficiencia + '%'}</p>
    <p><time datetime="${r.data.toISOString()}">${dataFormatada(r.data)}</time></p>
    <div class="interacoes"><button class="icone ${r.apoios.has(usuario?.id) ? 'reagido' : ''}" data-like="${r.id}" aria-label="Apoiar apontamento" aria-pressed="${r.apoios.has(usuario?.id)}"><img src="assets/like.svg" alt="Apoio">${r.apoios.size}</button><button class="icone" data-chat="${r.id}" aria-expanded="${abertos.has(r.id)}" aria-label="Comentários"><img src="assets/chat.svg" alt="Comentário">${r.comentarios.length}</button></div>
    ${abertos.has(r.id) ? `<section class="comentarios" aria-label="Comentários">${r.comentarios.map((c) => `<p><strong>${seguro(c.nome)}:</strong> ${seguro(c.texto)}</p>`).join('')}<form data-comentario="${r.id}" novalidate><label for="comentario-${r.id}">Comentário</label><input id="comentario-${r.id}" placeholder="Escrever um comentário..."><small class="erro" id="erro-comentario-${r.id}" role="alert"></small><button class="icone" aria-label="Enviar comentário"><img src="assets/send.svg" alt="Enviar"></button></form></section>` : ''}
  </article>`,
      )
      .join('') || '<p>Nenhum apontamento nesta categoria.</p>';
  const botao = (texto, destino, desabilitado = false, atual = false) =>
    `<button data-pagina="${destino}" ${desabilitado ? 'disabled' : ''} ${atual ? 'aria-current="page"' : ''}>${texto}</button>`;
  $('paginacao').innerHTML =
    botao('Primeira', 1, pagina === 1) +
    botao('Anterior', pagina - 1, pagina === 1) +
    Array.from({ length: paginas }, (_, i) =>
      botao(i + 1, i + 1, false, pagina === i + 1),
    ).join('') +
    botao('Próxima', pagina + 1, pagina === paginas) +
    botao('Última', paginas, pagina === paginas);
}
$('autenticacao').onclick = () => {
  if (!usuario) {
    $('modal').showModal();
    return;
  }
  usuario = null;
  filtro = '';
  pagina = 1;
  abertos.clear();
  mostrarCadastro(false);
  atualizar();
};
$('fechar').onclick = $('cancelar').onclick = () => $('modal').close();
$('form-login').onsubmit = (evento) => {
  evento.preventDefault();
  const email = $('email').value.trim();
  const senha = $('senha').value;
  erro(
    'email',
    !email
      ? 'email ou senha obrigatório.'
      : email !== 'operador@empresa.com'
        ? 'email ou senha incorreta.'
        : '',
  );
  erro(
    'senha',
    !senha.trim()
      ? 'email ou senha obrigatório.'
      : senha !== '123456'
        ? 'email ou senha incorreta.'
        : '',
  );
  if (email !== 'operador@empresa.com' || senha !== '123456') return;
  usuario = operador;
  $('modal').close();
  $('form-login').reset();
  atualizar();
};
$('registros').onclick = () => {
  if (autorizado()) mostrarCadastro(true);
};
$('inicio').onclick = () => mostrarCadastro(false);
document.querySelector('.filtros').onclick = (evento) => {
  const botao = evento.target.closest('[data-filtro]');
  if (!botao || !autorizado()) return;
  filtro = botao.dataset.filtro;
  pagina = 1;
  atualizar();
};
$('paginacao').onclick = (evento) => {
  const botao = evento.target.closest('[data-pagina]');
  if (!botao || !autorizado()) return;
  pagina = Number(botao.dataset.pagina);
  atualizar();
};
$('feed').onclick = (evento) => {
  const botao = evento.target.closest('[data-like], [data-chat]');
  if (!botao || !autorizado()) return;
  const registro = registros.find(
    (r) => r.id === Number(botao.dataset.like || botao.dataset.chat),
  );
  if (botao.dataset.like) {
    if (registro.apoios.has(usuario.id)) registro.apoios.delete(usuario.id);
    else registro.apoios.add(usuario.id);
  } else {
    if (abertos.has(registro.id)) abertos.delete(registro.id);
    else abertos.add(registro.id);
  }
  atualizar();
};
$('feed').onsubmit = (evento) => {
  evento.preventDefault();
  const formulario = evento.target;
  if (!formulario.dataset.comentario || !autorizado()) return;
  const id = Number(formulario.dataset.comentario);
  const texto = $(`comentario-${id}`).value.trim();
  erro(
    `comentario-${id}`,
    texto.length <= 2 ? 'não é possível enviar um comentário vazio.' : '',
  );
  if (texto.length <= 2) return;
  registros
    .find((r) => r.id === id)
    .comentarios.push({ nome: usuario.nome, texto });
  atualizar();
  $(`comentario-${id}`).focus();
};
$('form-registro').onsubmit = (evento) => {
  evento.preventDefault();
  if (!autorizado()) return;
  let valido = true;
  ['tipo', 'metros', 'minutos'].forEach((id) => {
    const valor = $(id).value.trim();
    let mensagem = !valor ? 'Campo obrigatório.' : '';
    if (valor && id === 'tipo' && !categorias.includes(valor))
      mensagem = 'Selecione manutenção, operação ou inspeção.';
    if (
      valor &&
      id !== 'tipo' &&
      (!Number.isFinite(Number(valor)) ||
        Number(valor) < 0 ||
        (id === 'minutos' && Number(valor) === 0))
    )
      mensagem = 'Informe um valor válido.';
    erro(id, mensagem);
    if (mensagem) valido = false;
  });
  if (!valido) return;
  registros.unshift({
    id: Date.now(),
    tipo: $('tipo').value.trim(),
    nome: usuario.nome,
    usuarioId: usuario.id,
    metros: Number($('metros').value),
    minutos: Number($('minutos').value),
    eficiencia: null,
    data: new Date(),
    apoios: new Set(),
    comentarios: [],
  });
  filtro = '';
  pagina = 1;
  $('form-registro').reset();
  mostrarCadastro(false);
  atualizar();
};
atualizar();
