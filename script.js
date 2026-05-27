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

  // Link do Formspree configurado
  const URL_FORMSPREE = "https://formspree.io/f/mgoqprpl";

  // Variáveis para controlar qual produto e forma de pagamento estão ativos
  let produtoAtualId = "";
  let produtoAtualTitulo = "";
  let produtoAtualPix = "";
  let produtoAtualLinkCartao = "";
  let formaPagamentoAtual = ""; // Guardará "pix" ou "cartao"

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

  async function marcarComoIndisponivel(idProduto, nomeProduto) {
    try {
      await db.collection("produtos").doc(idProduto).update({
        disponivel: false
      });
    } catch (error) {
      console.error("Erro ao atualizar item: ", error);
    }
  }

  // Função para enviar o e-mail de notificação em segundo plano
  async function enviarEmailNotificacao(nomeConvidado, nomeProduto, formaPagamento) {
    try {
      await fetch(URL_FORMSPREE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: `Olá Alex! O(a) convidado(a) ${nomeConvidado} escolheu o presente: ${nomeProduto} (Pago via ${formaPagamento.toUpperCase()}) na sua lista de casamento.`
        })
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail: ", error);
    }
  }

  const listaContainer = document.getElementById('lista-produtos');
  const modal = document.getElementById('modal-nome');
  const inputNome = document.getElementById('nome-convidado');

  // ESCUTANDO O BANCO DE DADOS EM TEMPO REAL
  db.collection("produtos").onSnapshot((snapshot) => {
    listaContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const produto = doc.data();
      const id = doc.id;

      const textoDisponibilidade = produto.disponivel ? "Disponível" : "Indisponível";
      const classeDisponibilidade = produto.disponivel ? "disponivel" : "indisponivel";
      
      const mainConteudo = document.createElement('main');
      mainConteudo.className = 'conteudo';
      
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
                   <a class="botao botao-cartao" href="${produto.linkCartao}" data-id="${id}" data-titulo="${produto.titulo}">Cartão</a>`
                : `<button class="botao" disabled style="background-color: #ccc; cursor: not-allowed;">Ganhamos!</button>`
              }
            </div>
          </div>
        </section>
      `;

      listaContainer.appendChild(mainConteudo);
    });

    // CONFIGURANDO O CLIQUE DO BOTÃO PIX (ABRE O MODAL)
    document.querySelectorAll('.botao-pix').forEach(botao => {
      botao.addEventListener('click', function() {
        produtoAtualId = this.dataset.id;
        produtoAtualTitulo = this.dataset.titulo;
        produtoAtualPix = this.dataset.pix;
        formaPagamentoAtual = "pix";

        // Limpa o input e abre a janelinha na tela
        inputNome.value = "";
        modal.classList.add('mostrar');
        inputNome.focus();
      });
    });

    // CONFIGURANDO O CLIQUE DO BOTÃO CARTÃO (AGORA TAMBÉM ABRE O MODAL!)
    document.querySelectorAll('.botao-cartao').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault(); // Impede de abrir o link direto
        
        produtoAtualId = this.dataset.id;
        produtoAtualTitulo = this.dataset.titulo;
        produtoAtualLinkCartao = this.href;
        formaPagamentoAtual = "cartao";

        // Limpa o input e abre a janelinha na tela
        inputNome.value = "";
        modal.classList.add('mostrar');
        inputNome.focus();
      });
    });
  });

  // BOTÕES DE CONTROLE DO MODAL
  document.getElementById('btn-cancelar-modal').addEventListener('click', () => {
    modal.classList.remove('mostrar');
  });

  document.getElementById('btn-confirmar-modal').addEventListener('click', async () => {
    const nome = inputNome.value.trim();
    
    if (nome === "") {
      alert("Por favor, digite o seu nome para continuar.");
      return;
    }

    // Fecha o modal na tela
    modal.classList.remove('mostrar');

    // 1. Envia o e-mail de notificação avisando quem comprou e o método escolhido
    enviarEmailNotificacao(nome, produtoAtualTitulo, formaPagamentoAtual);

    // 2. Marca o produto como esgotado ("Ganhamos!") no Firebase
    await marcarComoIndisponivel(produtoAtualId, produtoAtualTitulo);

    // 3. Verifica qual botão iniciou a ação e faz o fluxo correspondente
    if (formaPagamentoAtual === "pix") {
      // Se foi PIX: Copia a chave e solta o alerta final
      await copiarPix(produtoAtualPix);
      alert(`Obrigado, ${nome}! O presente "${produtoAtualTitulo}" foi reservado para você. A chave PIX já foi copiada automaticamente, basta colar no aplicativo do seu banco para pagar.`);
    } else if (formaPagamentoAtual === "cartao") {
      // Se foi CARTÃO: Alerta o usuário e abre a página de pagamento da InfinitePay
      alert(`Obrigado, ${nome}! O presente "${produtoAtualTitulo}" foi reservado. Clique em OK para ser redirecionado à página de pagamento seguro com cartão.`);
      window.open(produtoAtualLinkCartao, '_blank', 'noopener,noreferrer');
    }
  });

})();
