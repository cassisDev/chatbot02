document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    let userName = '';
    let conversationState = 'askName';
    let inactivityTimer;
    let typingIndicatorActive = false;

    function addBotMessage(text, delay = 0) {
        return new Promise(resolve => {
            setTimeout(() => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message bot-message';
                messageDiv.innerHTML = text;
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                resolve();
            }, delay);
        });
    }

    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // exibe o indicador de digitação
    function showTypingIndicator() {
        if (typingIndicatorActive) return;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        typingIndicatorActive = true;
    }

    // remover o indicador de digitação
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
            typingIndicatorActive = false;
        }
    }

    //encadear mensagens com o indicador de digitação
    async function botRespond(messages) {
        for (let i = 0; i < messages.length; i++) {
            showTypingIndicator();
            await new Promise(resolve => setTimeout(resolve, messages[i].typingDelay || 1000));
            removeTypingIndicator();
            await addBotMessage(messages[i].text, messages[i].messageDelay || 500);
        }
    }

    // botões de opção
    function showOptions(options, question = '') {
        if (question) {
            addBotMessage(question);
        }
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        options.forEach(option => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'option-btn';
            optionBtn.textContent = option;
            optionBtn.addEventListener('click', function() {
                userInput.value = option;
                sendMessage();
            });
            optionsContainer.appendChild(optionBtn);
        });
        
        chatMessages.appendChild(optionsContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        userInput.focus();
    }

    // --- inatividade ---
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (conversationState !== 'endConversationConfirmed') {
                botRespond([{
                    text: `Olá ${userName || 'visitante'}! Estou aqui se precisar de algo. Quer continuar a conversa?`,
                    typingDelay: 1500,
                    messageDelay: 800
                }]);
                conversationState = 'inactive';
            }
        }, 60000); // 1 minuto de inatividade
    }

    setTimeout(() => {
        addBotMessage('Olá! Qual é o seu nome?');
    }, 800);
    
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    userInput.addEventListener('input', resetInactivityTimer);
    sendBtn.addEventListener('click', resetInactivityTimer);


    // --- gerenciamento de mensagens ---
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        addUserMessage(message);
        userInput.value = '';
        resetInactivityTimer();
        
        if (conversationState === 'inactive' || conversationState === 'endConversationConfirmed') {
            botRespond([{
                text: `Que bom te ver novamente, ${userName || 'visitante'}! Como posso ajudar hoje?`,
                typingDelay: 1000,
                messageDelay: 500
            }]).then(() => {
                showMainMenu();
            });
            return;
        }

        // processar a mensagem do usuário com base no estado normal da conversa
        if (conversationState === 'askName') {
            handleNameResponse(message);
        } else if (conversationState === 'mainMenu') {
            handleMainMenuChoice(message);
        } else if (conversationState === 'askInterest') {
            handleInterestResponse(message);
        } else if (conversationState === 'finalQuestion') {
            handleFinalResponse(message);
        } else if (conversationState === 'contactOptions') {
            handleContactOption(message);
        } else if (conversationState === 'faqMenu') {
            handleFaqChoice(message);
        } else if (conversationState === 'feedback') {
            handleFeedbackInput(message);
        } else if (conversationState === 'blog') {
            handleBlogChoice(message);
        }
    }
    
    // --- funções de resposta ---
    async function handleNameResponse(message) {
        let detectedName = '';
        const lowerMessage = message.toLowerCase();

        // Regex para capturar o nome de forma mais precisa
        const regexPatterns = [
            // Captura o nome após frases de apresentação comuns e variações.
            // Opcionalmente ignora pontuações ou "meu" no início da frase de saudação.
            /(?:(?:olá|oi|prazer|meu nome é|eu me chamo|é|sou|meu nome eh|eu sou)\s*[,.!]?\s*)?([a-záàâãéèêíóôõúç\s]+)/i,
            // Captura a frase inteira se for apenas o nome ou uma saudação simples.
            /^([a-záàâãéèêíóôõúç\s]+)$/i
        ];

        for (let i = 0; i < regexPatterns.length; i++) {
            const match = lowerMessage.match(regexPatterns[i]);
            if (match && match[1]) {
                // Tenta limpar o nome, removendo o que parecem ser saudações ou palavras-chave no início
                let potentialName = match[1].trim();
                const cleanNameMatch = potentialName.match(/^(?:(?:meu nome é|eu me chamo|é|sou|meu nome eh|eu sou|prazer|oi|olá|ola)\s*[,.!]?\s*)?([a-záàâãéèêíóôõúç\s]+)$/i);
                if (cleanNameMatch && cleanNameMatch[1]) {
                    detectedName = cleanNameMatch[1].trim();
                } else {
                    detectedName = potentialName; // Se a limpeza não encontrar um padrão, usa o que já tem
                }
                break; 
            }
        }
        
        // Garante que a primeira letra de cada palavra seja maiúscula
        detectedName = detectedName.split(' ').map(word => 
            word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''
        ).join(' ').trim();


        // Validação de nome
        if (detectedName.length < 2 || detectedName.match(/\d/)) { 
            await botRespond([{
                text: 'Hmm, esse nome parece um pouco incomum. Por favor, digite um nome válido para eu te conhecer melhor.',
                typingDelay: 1200, messageDelay: 600
            }]);
            return;
        }

        userName = detectedName; // Armazena o nome detectado
        await botRespond([
            { text: `Prazer em conhecê-lo, ${userName}! :D`, typingDelay: 1000, messageDelay: 800 },
            { text: 'Eu sou um assistente virtual criado por Henrique Cassis do HenriqueCassisDev.com', typingDelay: 1500, messageDelay: 800 }
        ]);
        
        showMainMenu();
    }

    async function showMainMenu() {
        await botRespond([{
            text: `Como posso te ajudar hoje, ${userName}?`,
            typingDelay: 1000, messageDelay: 500
        }]);
        const options = ['Serviços', 'Contato', 'Perguntas Frequentes (FAQ)', 'Agendar Reunião', 'Blog', 'Deixar um Feedback', 'Encerrar Conversa'];
        showOptions(options);
        conversationState = 'mainMenu';
    }

    async function handleMainMenuChoice(choice) {
        const lowerChoice = choice.toLowerCase();
        if (lowerChoice.includes('serviços')) {
            await botRespond([{ text: 'Meu criador é especialista em:', typingDelay: 800, messageDelay: 500 }]);
            const options = ['Website', 'Chatbot', 'e-Commerce', 'Hospedagem', 'Voltar ao menu principal'];
            showOptions(options, 'No que você está interessado?');
            conversationState = 'askInterest';
        } else if (lowerChoice.includes('contato')) {
            showContactOptions();
        } else if (lowerChoice.includes('perguntas frequentes') || lowerChoice.includes('faq')) {
            showFaqMenu();
        } else if (lowerChoice.includes('agendar reuniã') || lowerChoice.includes('reunião') || lowerChoice.includes('chamada')) {
            showSchedulingOption();
        } else if (lowerChoice.includes('blog') || lowerChoice.includes('conteúdo')) {
            showBlogMenu();
        } else if (lowerChoice.includes('feedback') || lowerChoice.includes('sugestão')) {
            await botRespond([{
                text: 'Agradeço seu interesse em dar um feedback! Por favor, digite sua sugestão ou comentário:',
                typingDelay: 1000, messageDelay: 500
            }]);
            conversationState = 'feedback';
        } else if (lowerChoice.includes('encerrar') || lowerChoice.includes('finalizar') || lowerChoice.includes('sair')) {
            await botRespond([
                { text: `Entendido! Obrigado por conversar comigo, ${userName}! 😊`, typingDelay: 1200, messageDelay: 600 },
                { text: 'Se precisar de algo mais, estou à disposição. Tenha um ótimo dia!', typingDelay: 1500, messageDelay: 800 }
            ]);
            conversationState = 'endConversationConfirmed';
        } else {
            showNotUnderstoodMainMenu();
        }
    }

    async function handleInterestResponse(message) {
        let service = '';
        let portfolioLink = '';
        
        if (message.toLowerCase().includes('web') || message.toLowerCase().includes('site')) {
            service = 'Website';
            portfolioLink = 'https://henriquecassisdev.com/portfolio-websites';
        } 
        else if (message.toLowerCase().includes('chatbot')) {
            service = 'Chatbot';
            portfolioLink = 'https://henriquecassisdev.com/portfolio-chatbots';
        } 
        else if (message.toLowerCase().includes('e-com') || message.toLowerCase().includes('loja')) {
            service = 'e-Commerce';
            portfolioLink = 'https://henriquecassisdev.com/portfolio-ecommerce';
        } 
        else if (message.toLowerCase().includes('hosped')) {
            service = 'Hospedagem';
            portfolioLink = 'https://henriquecassisdev.com/hospedagem';
        } else if (message.toLowerCase().includes('voltar ao menu principal')) {
            showMainMenu();
            return;
        } else {
            showNotUnderstood();
            return;
        }
        
        await botRespond([
            { text: `Excelente escolha! Para ${service}, o Henrique tem soluções incríveis.`, typingDelay: 1500, messageDelay: 800 },
            { text: `Aqui está o portfólio de ${service}:`, typingDelay: 800, messageDelay: 500 }
        ]);

        const linkElement = document.createElement('a');
        linkElement.className = 'portfolio-link';
        linkElement.href = portfolioLink;
        linkElement.target = '_blank';
        linkElement.textContent = `Ver portfólio de ${service}`;
        chatMessages.appendChild(linkElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        await botRespond([
            { text: 'Quer saber mais ou falar diretamente?', typingDelay: 800, messageDelay: 500 }
        ]);
        
        showOptions(['Falar no WhatsApp', 'Voltar ao menu principal']);
        conversationState = 'finalQuestion';
    }
    
    async function handleFinalResponse(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('whatsapp') || lowerMessage.includes('falar')) {
            const whatsappElement = document.createElement('a');
            whatsappElement.className = 'whatsapp-btn';
            whatsappElement.href = 'https://wa.me/5519996432877'; 
            whatsappElement.target = '_blank';
            whatsappElement.innerHTML = '<i class="fab fa-whatsapp"></i> Conversar no WhatsApp';
            chatMessages.appendChild(whatsappElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            await botRespond([
                { text: 'Fico feliz em ajudar! Posso te ajudar com mais alguma coisa?', typingDelay: 1000, messageDelay: 500 }
            ]);
            showOptions(['Sim', 'Não']);
            conversationState = 'finalQuestion';
        } else if (lowerMessage.includes('sim') || lowerMessage.includes('quero')) {
            showMainMenu();
        } else if (lowerMessage.includes('não') || lowerMessage.includes('obrigado') || lowerMessage.includes('voltar ao menu principal')) {
            await botRespond([
                { text: `Entendido! Obrigado por conversar comigo, ${userName}! 😊`, typingDelay: 1200, messageDelay: 600 },
                { text: 'Se precisar de algo mais, estou à disposição. Tenha um ótimo dia!', typingDelay: 1500, messageDelay: 800 }
            ]);
            conversationState = 'endConversationConfirmed';
        } else {
            showNotUnderstood();
        }
    }

    async function showNotUnderstood() {
        await botRespond([{
            text: `Desculpe ${userName}, não consegui entender sua resposta.`,
            typingDelay: 1000, messageDelay: 500
        }, {
            text: 'Por favor, selecione uma das opções ou digite uma palavra-chave.',
            typingDelay: 1500, messageDelay: 800
        }]);
        if (conversationState === 'askInterest') {
             const options = ['Website', 'Chatbot', 'e-Commerce', 'Hospedagem', 'Voltar ao menu principal'];
             showOptions(options, 'No que você está interessado?');
        } else {
            showMainMenu();
        }
    }

    async function showNotUnderstoodMainMenu() {
        await botRespond([{
            text: `Desculpe ${userName}, não entendi a opção.`,
            typingDelay: 1000, messageDelay: 500
        }, {
            text: 'Por favor, selecione uma das opções do menu principal.',
            typingDelay: 1500, messageDelay: 800
        }]);
        showMainMenu();
    }

    async function showContactOptions() {
        await botRespond([{
            text: 'Certo! Você pode entrar em contato com o Henrique pelos seguintes canais:',
            typingDelay: 1000, messageDelay: 500
        }]);
        const options = ['WhatsApp', 'E-mail', 'Telefone', 'LinkedIn', 'Instagram', 'Voltar ao menu principal'];
        showOptions(options);
        conversationState = 'contactOptions';
    }

    async function handleContactOption(choice) {
        const lowerChoice = choice.toLowerCase();
        if (lowerChoice.includes('whatsapp')) {
            const whatsappElement = document.createElement('a');
            whatsappElement.className = 'whatsapp-btn';
            whatsappElement.href = 'https://wa.me/5519996432877'; 
            whatsappElement.target = '_blank';
            whatsappElement.innerHTML = '<i class="fab fa-whatsapp"></i> Conversar no WhatsApp';
            chatMessages.appendChild(whatsappElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            await botRespond([{ text: 'Aguarde o Henrique no WhatsApp! Posso te ajudar com mais algo?', typingDelay: 1000 }]);
            showOptions(['Sim', 'Não']);
            conversationState = 'finalQuestion';
        } else if (lowerChoice.includes('e-mail') || lowerChoice.includes('email')) {
            await botRespond([{ text: 'Envie um e-mail para o Henrique:', typingDelay: 800 }]);
            const emailLink = document.createElement('a');
            emailLink.className = 'portfolio-link';
            emailLink.href = 'mailto:henriquecassisdev@gmail.com';
            emailLink.textContent = 'henriquecassisdev@gmail.com';
            chatMessages.appendChild(emailLink);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            await botRespond([{ text: 'Posso te ajudar com mais algo?', typingDelay: 1000 }]);
            showOptions(['Sim', 'Não']);
            conversationState = 'finalQuestion';
        } else if (lowerChoice.includes('telefone')) {
            await botRespond([{ text: 'Ligue para o Henrique:', typingDelay: 800 }]);
            const phoneLink = document.createElement('a');
            phoneLink.className = 'portfolio-link';
            phoneLink.href = 'tel:+5519996432877'; 
            phoneLink.textContent = '+55 19 99999-9999';
            chatMessages.appendChild(phoneLink);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            await botRespond([{ text: 'Posso te ajudar com mais algo?', typingDelay: 1000 }]);
            showOptions(['Sim', 'Não']);
            conversationState = 'finalQuestion';
        } else if (lowerChoice.includes('linkedin')) {
            const linkedinLink = document.createElement('a');
            linkedinLink.className = 'portfolio-link';
            linkedinLink.href = 'https://www.linkedin.com/in/henrique-cassis-bb6b0920b/';
            linkedinLink.target = '_blank';
            linkedinLink.textContent = 'Perfil do LinkedIn';
            chatMessages.appendChild(linkedinLink);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            await botRespond([{ text: 'Conecte-se com o Henrique no LinkedIn! Posso te ajudar com mais algo?', typingDelay: 1000 }]);
            showOptions(['Sim', 'Não']);
            conversationState = 'finalQuestion';
        } else if (lowerChoice.includes('instagram')) {
            const instagramLink = document.createElement('a');
            instagramLink.className = 'portfolio-link';
            instagramLink.href = 'https://www.instagram.com/henrique.cassis'; 
            instagramLink.target = '_blank';
            instagramLink.textContent = 'Perfil do Instagram';
            chatMessages.appendChild(instagramLink);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            await botRespond([{ text: 'Siga o Henrique no Instagram! Posso te ajudar com mais algo?', typingDelay: 1000 }]);
            showOptions(['Sim', 'Não']);
            conversationState = 'finalQuestion';
        } else if (lowerChoice.includes('voltar ao menu principal')) {
            showMainMenu();
        } else {
            showNotUnderstood();
        }
    }

    async function showFaqMenu() {
        await botRespond([{
            text: 'Tenho algumas respostas para perguntas frequentes que podem te ajudar. Qual a sua dúvida?',
            typingDelay: 1200, messageDelay: 600
        }]);
        const options = ['Quanto custa um site?', 'Qual o prazo de entrega?', 'Vocês fazem manutenção?', 'Formas de pagamento?', 'Voltar ao menu principal'];
        showOptions(options);
        conversationState = 'faqMenu';
    }

    async function handleFaqChoice(choice) {
        const lowerChoice = choice.toLowerCase();
        let answer = '';
        if (lowerChoice.includes('quanto custa') || lowerChoice.includes('custo')) {
            answer = 'O custo de um site ou projeto varia muito dependendo da complexidade, recursos e tempo de desenvolvimento. Para um orçamento preciso, sugiro agendar uma conversa com o Henrique!';
        } else if (lowerChoice.includes('prazo de entrega') || lowerChoice.includes('prazo')) {
            answer = 'O prazo de entrega é definido após a análise detalhada do projeto, pois cada solução é personalizada. Em média, um site simples pode levar de 3 a 5 semanas.';
        } else if (lowerChoice.includes('manutenção')) {
            answer = 'Sim, oferecemos serviços de manutenção e suporte contínuo para garantir que seu site ou chatbot esteja sempre atualizado e funcionando perfeitamente.';
        } else if (lowerChoice.includes('formas de pagamento') || lowerChoice.includes('pagamento')) {
            answer = 'Aceitamos diversas formas de pagamento, incluindo Pix, transferência bancária e cartões de crédito. Detalhes podem ser combinados diretamente com o Henrique.';
        } else if (lowerChoice.includes('voltar ao menu principal')) {
            showMainMenu();
            return;
        } else {
            showNotUnderstood();
            return;
        }
        await botRespond([{ text: answer, typingDelay: 1500, messageDelay: 800 }]);
        await botRespond([{ text: 'Quer saber mais sobre outra pergunta frequente?', typingDelay: 1000, messageDelay: 500 }]);
        showOptions(['Sim', 'Não', 'Voltar ao menu principal']);
        conversationState = 'finalQuestion';
    }

    async function showSchedulingOption() {
        await botRespond([
            { text: `Sim, ${userName}! Agendar uma conversa direta com o Henrique é uma ótima forma de discutir seu projeto em detalhes.`, typingDelay: 1500, messageDelay: 800 },
            { text: 'Você pode escolher o melhor horário e dia diretamente na agenda dele aqui:', typingDelay: 1000, messageDelay: 500 }
        ]);
        const scheduleLink = document.createElement('a');
        scheduleLink.className = 'portfolio-link';
        scheduleLink.href = 'https://calendly.com/henriquecassisdev'; 
        scheduleLink.target = '_blank';
        scheduleLink.textContent = 'Agendar Reunião Online';
        chatMessages.appendChild(scheduleLink);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        await botRespond([{ text: 'Posso te ajudar com mais alguma coisa?', typingDelay: 1000, messageDelay: 500 }]);
        showOptions(['Sim', 'Não']);
        conversationState = 'finalQuestion';
    }

    async function handleFeedbackInput(feedbackMessage) {
        if (feedbackMessage.length < 10) {
            await botRespond([{
                text: 'Obrigado pelo seu feedback! Para que ele seja mais útil, poderia detalhar um pouco mais?',
                typingDelay: 1200, messageDelay: 600
            }]);
            return;
        }
        console.log(`Feedback de ${userName}: ${feedbackMessage}`);
        await botRespond([{
            text: 'Seu feedback foi recebido com sucesso! Agradecemos muito a sua contribuição para melhorar nossos serviços.',
            typingDelay: 1500, messageDelay: 800
        }]);
        showMainMenu();
    }

    async function showBlogMenu() {
        await botRespond([
            { text: `Sim, ${userName}! O Henrique compartilha muito conhecimento no blog dele.`, typingDelay: 1200, messageDelay: 600 },
            { text: 'Confira os últimos artigos e dicas sobre desenvolvimento, chatbots e e-commerce:', typingDelay: 1000, messageDelay: 500 }
        ]);
        const blogLink = document.createElement('a');
        blogLink.className = 'portfolio-link';
        blogLink.href = 'https://henriquecassisdev.com/blog'; 
        blogLink.target = '_blank';
        blogLink.textContent = 'Acessar o Blog';
        chatMessages.appendChild(blogLink);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        await botRespond([{ text: 'Posso te ajudar com mais alguma coisa?', typingDelay: 1000, messageDelay: 500 }]);
        showOptions(['Sim', 'Não']);
        conversationState = 'finalQuestion';
    }

    resetInactivityTimer();
});