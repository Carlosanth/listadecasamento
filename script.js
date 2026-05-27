(function Harvey(){
  const firebaseConfig = {
    apiKey: "AIzaSyD-VWgC9Z8R9IgjlnYRNmGxG8YrEFTlzMM",
    authDomain: "lista-casamento-8c482.firebaseapp.com",
    projectId: "lista-casamento-8c482",
    storageBucket: "lista-casamento-8c482.firebasestorage.app",
    messagingSenderId: "873428866016",
    appId: "1:873428866016:web:985b96d66a18ff399ed185"
  };

  // Inicializa o Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Função para exibir a mensagem na tela (Toast)
  function showToast(msg){
    let t = document.getElementById('toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(()=> t.classList.remove('show'), 3500);
  }

  // Função para copiar o texto do PIX
  async function copiarPix(texto) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch(e) {
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(_) {}
      ta.remove();
    }
  }

  // Função para atualizar o status do item no Firebase para Indisponível
  async function marcarComoIndisponivel(idProduto, nomeProduto) {
    try {
      await db.collection("produtos").doc(idProduto).update({
        disponivel: false
      });
      showToast(`Você escolheu: ${nomeProduto}! O item foi reservado.`);
    } catch (error) {
      console.error("Erro ao atualizar item: ", error);
    }
  }

  const listaContainer = document.getElementById('lista-produtos');

  // ESCUTANDO O BANCO DE DADOS EM TEMPO REAL
  db.collection("produtos").onSnapshot((snapshot) => {
    listaContainer.innerHTML = ""; // Limpa a tela para atualizar

    snapshot.forEach((doc) => {
      const produto = doc.data();
      const id = doc.id;

      // Define os textos de disponibilidade com base no banco de dados
      const textoDisponibilidade = produto.disponivel ? "Disponível" : "Indisponível";
      const classeDisponibilidade = produto.disponivel ? "disponivel" : "indisponivel";
      
      // Cria a estrutura do cartão
      const mainConteudo = document.createElement('main');
      mainConteudo.className = 'conteudo';
      
      // Se já estiver indisponível, podemos adicionar uma classe para mudar o visual via CSS se quiser
      if (!produto.disponivel) {
        mainConteudo.classList.add('item-esgotado');
      }

      mainConteudo.innerHTML = `
        <section class="cartao-produto">
          <div class="imagem-produto">
            <img src="${produto.imagem}" alt="${produto.titulo}" />
          </div>

          <div class="titulo-produto">${produto.titulo}</div>

          <div class="rodape-produto">
            <div class="caixa-preco">
              <div class="rotulo-preco">Valor:</div>
              <div class="preco">${produto.preco}</div>
              <div class="disponibilidade ${classeDisponibilidade}">${textoDisponibilidade}</div>
            </div>

            <div class="acoes">
              ${produto.disponivel 
                ? `<button class="botao primario botao-pix" data-id="${id}" data-pix="${produto.pix}" data-titulo="${produto.titulo}">PIX</button>
                   <a class="botao botao-cartao" href="${produto.linkCartao}" data-id="${id}" data-titulo="${produto.titulo}" target="_blank" rel="noopener noreferrer">Cartão</a>`
                : `<button class="botao" disabled style="background-color: #ccc; cursor: not-allowed;">Esgotado</button>`
              }
            </div>
          </div>
        </section>
      `;

      listaContainer.appendChild(mainConteudo);
    });

    // EVENTO DO BOTÃO PIX
    document.querySelectorAll('.botao-pix').forEach(botao => {
      botao.addEventListener('click', async function() {
        const pix = this.dataset.pix;
        const id = this.dataset.id;
        const titulo = this.dataset.titulo;

        await copiarPix(pix);
        showToast('Chave PIX copiada! Cole no seu app de banco.');

        // Abre uma confirmação para o convidado reservar o item
        setTimeout(() => {
          if (confirm(`Você vai pagar o presente "${titulo}" via PIX? Se sim, vamos marcar ele como Indisponível para ninguém mais escolher.`)) {
            marcarComoIndisponivel(id, titulo);
          }
        }, 1000);
      });
    });

    // EVENTO DO BOTÃO CARTÃO
    document.querySelectorAll('.botao-cartao').forEach(link => {
      link.addEventListener('click', function(e) {
        const id = this.dataset.id;
        const titulo = this.dataset.titulo;

        // Como o cartão abre outra página, marcamos como indisponível na hora do clique
        marcarComoIndisponivel(id, titulo);
      });
    });

  });

})();
