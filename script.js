(function Harvey(){
  const firebaseConfig = {
    apiKey: "AIzaSyD-VWgC9Z8R9IgjlnYRNmGxG8YrEFTlzMM",
    authDomain: "lista-casamento-8c482.firebaseapp.com",
    projectId: "lista-casamento-8c482",
    storageBucket: "lista-casamento-8c482.firebasestorage.app",
    messagingSenderId: "873428866016",
    appId: "1:873428866016:web:985b96d66a18ff399ed185"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const URL_FORMSPREE = "https://formspree.io/f/mgoqprpl";

  let produtoAtualId = "";
  let produtoAtualTitulo = "";
  let produtoAtualPix = "";
  let produtoAtualLinkCartao = "";
  let formaPagamentoAtual = "";

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

  async function marcarComoIndisponivel(idProduto) {
    try {
      await db.collection("produtos").doc(idProduto).update({
        disponivel: false
      });
    } catch (error) {
      console.error("Erro ao atualizar item: ", error);
    }
  }

  async function enviarEmailNotificacao(nomeConvidado, nomeProduto, formaPagamento) {
    try {
      await fetch(URL_FORMSPREE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: `Olá Carlos! O(a) convidado(a) ${nomeConvidado} escolheu o presente: ${nomeProduto} (Pago via ${formaPagamento.toUpperCase()}) na sua lista de casamento.`
        })
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail: ", error);
    }
  }

  // Rodar apenas quando a página estiver totalmente carregada
  window.addEventListener('DOMContentLoaded', () => {
    const listaContainer = document.getElementById('lista-produtos');
    const modal = document.getElementById('modal-nome');
    const inputNome = document.getElementById('nome-convidado');

    if (!listaContainer) {
      alert("Erro crítico: Não encontrei a div 'lista-produtos' no seu HTML!");
      return;
    }

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

      // EVENTO DO PIX
      document.querySelectorAll('.botao-pix').forEach(botao => {
        botao.addEventListener('click', function() {
          produtoAtualId = this.dataset.id;
          produtoAtualTitulo = this.dataset.titulo;
          produtoAtualPix = this.dataset.pix;
          formaPagamentoAtual = "pix";

          const m = document.getElementById('modal-nome');
          if(m) {
            if(inputNome) inputNome.value = "";
            m.classList.add('mostrar');
            if(inputNome) inputNome.focus();
          } else {
            // Se o CSS ou HTML falharem, o JS usa o prompt do próprio navegador como plano B
            const nomeBackup = prompt("Digite seu nome completo para reservar o PIX:");
            if(nomeBackup) finalizarCompra(nomeBackup);
          }
        });
      });

      // EVENTO DO CARTÃO
      document.querySelectorAll('.botao-cartao').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault(); 
          
          produtoAtualId = this.dataset.id;
          produtoAtualTitulo = this.dataset.titulo;
          produtoAtualLinkCartao = this.getAttribute('href'); 
          formaPagamentoAtual = "cartao";

          const m = document.getElementById('modal-nome');
          if(m) {
            if(inputNome) inputNome.value = "";
            m.classList.add('mostrar');
            if(inputNome) inputNome.focus();
          } else {
            const nomeBackup = prompt("Digite seu nome completo para pagar com Cartão:");
            if(nomeBackup) finalizarCompra(nomeBackup);
          }
        });
      });
    });

    // BOTÕES DO MODAL (CANCELAR)
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    if(btnCancelar) {
      btnCancelar.addEventListener('click', () => {
        const m = document.getElementById('modal-nome');
        if(m) m.classList.remove('mostrar');
      });
    }

    // BOTÕES DO MODAL (CONFIRMAR)
    const btnConfirmar = document.getElementById('btn-confirmar-modal');
    if(btnConfirmar) {
      btnConfirmar.addEventListener('click', async () => {
        const nome = inputNome ? inputNome.value.trim() : "";
        if (nome === "") {
          alert("Por favor, digite o seu nome para continuar.");
          return;
        }
        const m = document.getElementById('modal-nome');
        if(m) m.classList.remove('mostrar');
        
        await finalizarCompra(nome);
      });
    }

    // Função central para terminar o processo
    async function finalizarCompra(nomeConvidado) {
      enviarEmailNotificacao(nomeConvidado, produtoAtualTitulo, formaPagamentoAtual);
      await marcarComoIndisponivel(produtoAtualId);

      if (formaPagamentoAtual === "pix") {
        await copiarPix(produtoAtualPix);
        alert(`Obrigado, ${nomeConvidado}! O presente "${produtoAtualTitulo}" foi reservado para você. A chave PIX já foi copiada automaticamente, basta colar no aplicativo do seu banco para pagar.`);
      } else if (formaPagamentoAtual === "cartao") {
        alert(`Obrigado, ${nomeConvidado}! O presente "${produtoAtualTitulo}" foi reservado. Clique em OK para ser redirecionado à página de pagamento seguro com cartão.`);
        window.open(produtoAtualLinkCartao, '_blank', 'noopener,noreferrer');
      }
    }
  });
})();
