import { initializeApp } from "firebase/app"
import { getAnalytics, logEvent } from "firebase/analytics"
import { getAuth, GoogleAuthProvider, UserCredential, signInWithPopup, OAuthCredential, signInWithEmailAndPassword  } from "firebase/auth"
import { DatabaseReference, getDatabase, get, ref, set, onValue } from "firebase/database"
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"
import {Chart} from "chart.js/auto"


export const app = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL // Inclua o URL do banco de dados
});


initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LfIaiolAAAAAOlGQwgUO_O7OkqgUaeYEuAI2XTh"),
  isTokenAutoRefreshEnabled: true,
});

const db = getDatabase(app);

const analytics = getAnalytics(app)

export async function added() {
  console.log("Function added() is running");
  // Autenticação
  const auth = getAuth(app);

  const email = process.env.EMAIL_AUTH
  const password = process.env.AUTH_PASSWORD
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Usuário autenticado com sucesso:', userCredential.user.uid);
    const user = userCredential.user;


    const form = document.querySelector('.freight-form'); // Verifique se a classe está correta
    if (!form) throw new Error('Formulário não encontrado');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const product = document.querySelector('[name=product]').value;
      const cep = document.querySelector('[name=cep]').value;
      const length = document.querySelector('[name=length]').value;
      const width = document.querySelector('[name=width]').value;
      const height = document.querySelector('[name=height]').value;
      const weight = document.querySelector('[name=weight]').value;
      const destination = document.querySelector('[name=destination]').value;
      const address = document.querySelector('[name=address]').value;
      const street = document.querySelector('[name=street]').value;
      const state = document.querySelector('[name=state]').value;
      const number = document.querySelector('[name=number]').value;
      const complement = document.querySelector('[name=complement]').value;
      const freightValue = document.querySelector('[name=freight-value]').value;
      const additionalInfo = document.querySelector('[name=additional-info]').value;
      const contactName = document.querySelector('[name=contact-name]').value;
      const contactEmail = document.querySelector('[name=contact-email]').value;
      const contactPhone = document.querySelector('[name=contact-phone]').value;

      const pedido = {
        produto: product, // Novo campo "produto"
        cep_origem: cep,
        comprimento: length,
        largura: width,
        altura: height,
        cep_destino: destination,
        endereco: address,
        peso: weight,
        rua: street,
        estado: state,
        numero: number,
        complemento: complement,
        valor_carga: freightValue,
        info_adicional: additionalInfo,
        contato_numero: contactPhone,
        contato_nome: contactName,
        contato_email: contactEmail,
        data: new Date().toISOString(), // Adicionando a data de envio
        status: 'Pendente', // Status automático
        codigo_chave: "" 
      };

      const idRef = ref(db, 'ultimoId');
      const snapshot = await get(idRef);
      const ultimoId = parseInt(snapshot.val(), 10); // Converte para número
      const newId = ultimoId + 1;

      const newPedidoRef = ref(db, 'pedidos/' + newId);
      await set(newPedidoRef, pedido);
      await set(idRef, newId);

      console.log('Dados inseridos com sucesso!');
      form.reset();
    });

    // const pedidoRef = ref(db, 'pedidos');
    // onValue(pedidoRef, (snapshot) => {
    //   let list = document.querySelector('.list');
    //   if (!list) throw new Error('Elemento de lista não encontrado');

    //   list.innerHTML = '';
    //   snapshot.forEach((childSnapshot) => {
    //     const pedidoData = childSnapshot.val();
    //     list.innerHTML += `
    //          <div>
    //     Pedido ID: ${childSnapshot.key}<br>
    //     Produto: ${pedidoData.produto || 'Não disponível'}<br> <!-- Exibindo o Produto -->
    //     Origem: ${pedidoData.origem || 'Não disponível'}<br>
    //     CEP de Origem: ${pedidoData.cep_origem || 'Não disponível'}<br>
    //     Comprimento: ${pedidoData.comprimento || 'Não disponível'}<br>
    //     Largura: ${pedidoData.largura || 'Não disponível'}<br>
    //     Altura: ${pedidoData.altura || 'Não disponível'}<br>
    //     CEP de Destino: ${pedidoData.cep_destino || 'Não disponível'}<br>
    //     Endereço: ${pedidoData.endereco || 'Não disponível'}<br>
    //     Peso: ${pedidoData.peso || 'Não disponível'}<br>
    //     Rua: ${pedidoData.rua || 'Não disponível'}<br>
    //     Estado: ${pedidoData.estado || 'Não disponível'}<br>
    //     Número: ${pedidoData.numero || 'Não disponível'}<br>
    //     Complemento: ${pedidoData.complemento || 'Não disponível'}<br>
    //     Valor da Carga: ${pedidoData.valor_carga || 'Não disponível'}<br>
    //     Informações Adicionais: ${pedidoData.info_adicional || 'Não disponível'}<br>
    //     Contato - Nome: ${pedidoData.contato_nome || 'Não disponível'}<br>
    //     Contato - E-mail: ${pedidoData.contato_email || 'Não disponível'}<br>
    //     Contato - Telefone: ${pedidoData.contato_numero || 'Não disponível'}<br>
    //     Data de Envio: ${pedidoData.data || 'Não disponível'}<br>
    //     <hr>
    //   </div>`;
    //   });
    // });
  } catch (error) {
    console.error('Erro durante a autenticação ou inserção de dados:', error);
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error(`Erro de autenticação (${errorCode}): ${errorMessage}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  added();
});

const novaPedidosRef = ref(db, 'pedidos');

let myChart; // Variável para armazenar a instância do gráfico

// Função para processar e exibir dados na tabela e gráfico
onValue(novaPedidosRef, (snapshot) => {
    const pedidos = snapshot.val();
    console.log("Dados de pedidos recebidos:", pedidos);

    if (pedidos) {
        const realTimeTableBody = document.getElementById('real-time-table').querySelector('tbody');
        const orderHistoryBody = document.getElementById('order-history');
        
        realTimeTableBody.innerHTML = ''; // Limpar o conteúdo existente
        orderHistoryBody.innerHTML = '';  // Limpar o conteúdo existente
        
        let pedidosPorMes = {};
        let statusPorMes = {};

        for (let id in pedidos) {
            const pedido = pedidos[id];
            console.log("Processando pedido:", pedido);

            const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
          });

            // Adicionar à tabela de monitoramento em tempo real
            let realTimeRow = `
                <tr>
                    <td>${pedido.produto}</td>
                    <td>${pedido.endereco}</td>
                    <td>${pedido.codigoChave}</td>
                    <td>${pedido.status}</td>
                </tr>`;
            realTimeTableBody.insertAdjacentHTML('beforeend', realTimeRow);

            // Adicionar à tabela de histórico de pedidos
            let historyRow = `
                <tr>
                    <td>${dataFormatada}</td>
                    <td>${pedido.produto}</td>
                    <td>${pedido.status}</td>
                </tr>`;
            orderHistoryBody.insertAdjacentHTML('beforeend', historyRow);

            // Contabilizar pedidos por mês
            const mes = new Date(pedido.dataFormatada).getMonth();
            if (!pedidosPorMes[mes]) pedidosPorMes[mes] = 0;
            if (!statusPorMes[mes]) statusPorMes[mes] = { entregues: 0, cancelados: 0 };
            
            pedidosPorMes[mes]++;
            if (pedido.status === 'Entregue') statusPorMes[mes].entregues++;
            if (pedido.status === 'Cancelado') statusPorMes[mes].cancelados++;
        }

        console.log("Contagem de pedidos por mês:", pedidosPorMes);
        console.log("Status de pedidos por mês:", statusPorMes);

        // Atualizar o gráfico
        const ctx = document.getElementById('monitoringChar').getContext('2d');
        // Destruir o gráfico anterior se existir
        if (myChart) {
          myChart.destroy();
      }

        // Criar um novo gráfico
        myChart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: Object.keys(pedidosPorMes).map(mes => `Mês ${parseInt(mes) + 1}`),
              datasets: [{
                  label: 'Total de Pedidos',
                  data: Object.values(pedidosPorMes),
                  borderColor: 'rgb(75, 192, 192)',
                  fill: false
              }, {
                  label: 'Entregues',
                  data: Object.values(statusPorMes).map(status => status.entregues),
                  borderColor: 'rgb(54, 162, 235)',
                  fill: false
              }, {
                  label: 'Cancelados',
                  data: Object.values(statusPorMes).map(status => status.cancelados),
                  borderColor: 'rgb(255, 99, 132)',
                  fill: false
              }]
          },
          options: {
              scales: {
                  x: {
                      beginAtZero: true
                  },
                  y: {
                      beginAtZero: true
                  }
              },
              plugins: {
                  legend: {
                      display: true,
                      position: 'top'
                  },
                  title: {
                      display: true,
                      text: 'Monitoramento de Pedidos'
                  }
              }
          }
      });

      console.log("Gráfico atualizado com sucesso!");
  } else {
      console.log("Nenhum dado de pedidos encontrado.");
  }
}, (error) => {
  console.error("Erro ao acessar os dados:", error);
});