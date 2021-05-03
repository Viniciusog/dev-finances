/*Nosso modal (Tela que aparece na frente para adicionar uma nova transaçãio*/
const Modal = {
    /*Funções do nosso objeto Modal*/
    open () {
        
        //Abrir modal
        //Colocar classe active no modal
        const modal = document.querySelector(".modal-overlay")
        .classList.add("active")
        
    },
    close () {
        //Fechar modal
        //Remover classe active do modal
        const modal = document.querySelector(".modal-overlay")
        .classList.remove("active")
    }
} 

const Storage = {
    //Pega o nosso array do local storage
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions:")) || []
    },

    //seta o nosso array no local storage
    set(transactions) {
        localStorage.setItem("dev.finances:transactions:", JSON.stringify(transactions))
    }
}

//CLASSE TRANSACTION
//métodos do nosso objeto de transação que serão utilizados para atualizar o nosso BALANÇO
const Transaction = {
    //Lista de objetos de transações. 
    //Iremos adicionar uma transação aqui no array, a partir do formulário
    all: Storage.get(),

    //Estamos adicionando dentro do nosso array, um transaction
    add (transaction) {
        Transaction.all.push(transaction)

        //recarrega a nossa aplicação com as informações novas
        App.reload()
    }, 

    remove(index) {
        //Queremos remover a primeira (1) transação do index especificado
        Transaction.all.splice(index, 1)

        App.reload()
    },

    incomes() {
        //percorrer todas as transações
        //somar todos os incomes maiores do que zero
        //retornar o valor encontrado
        let totalIncome = 0
        Transaction.all.forEach(function (transaction) {
            if ((transaction.amount) > 0) {
                totalIncome += transaction.amount
            }
        })

        return totalIncome
    },

    expenses() {

        let totalExpenses = 0
        Transaction.all.forEach(function (transaction) {
            if ((transaction.amount) < 0) {
                totalExpenses += transaction.amount 
            }
        }) 
        return totalExpenses
    },

    total () {
        // 1000,91 + ( -5000)
        return Transaction.incomes() + Transaction.expenses()
    }
}

/*Nossa classe UTILS */
const Utils = {

    formatAmount (amount) {
        //Se chegar: 8.99 -> Ficará: 899
        //SE chegar: 8,55 -> Ficará: 855
        amount = Number(amount) * 100
        return amount
    },

    formatDate (date) {
        const splittedDate = date.split("-")
        
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}` //23/04/2021
    },

    formatCurrency (amount) {
        //Se for menor que zero, então teremos o sinal de negativo, se não, teremos nenhum sinal
        const signal = Number(amount) < 0 ? "-" : ""

        //Temos uma expressão regular que substitui tudo o que não é número por ""
        let value = String(amount).replace(/\D/g, "")

        //Agora estamos passando o nosso valor para inteiro e dividindo o por 100 
        //para que tenhamos duas casas decimais
        value = Number(value) / 100

        //Estamos verificando a região que estamos e colocando virgula (,) para o Brasil
        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })

        //Agora estamos retornando o nosso valor para que possa ser utilizado pelo nosso sistema
        //na parte de colocar dentro da nossa tabela por meio do JS
        return signal + value;

    }
}

//CLASSE DOM
const DOM = {

    /*Representa o nosso TBODY do HTML*/
    transactionsContainer: document.querySelector("#data-table tbody"),

    //Adiciona transaction no HTML da tabela. Index é a posição no array
    addTransaction(transaction, index) {
      
        const tr = document.createElement("tr")
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index
        
        DOM.transactionsContainer.appendChild(tr)
    },

    innerHTMLTransaction(transaction, index) {
        //Para cada transação, iremos analizar se essa transação é do tipo INCOME ou EXPENSE
        const CSSClass = transaction.amount > 0 ? "income" : "expense"

        const formattedAmount = Utils.formatCurrency(transaction.amount)

        const html = `  
            <td class="description">${transaction.description}</td>
            <td class="${CSSClass}">${formattedAmount}</td>
            <td class="date">${transaction.date}</td>
            <td><img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Apagar transação"></td>          
        `
        
        return html;
    },

    updateBalance() {
        document.querySelector("#incomeDisplay").innerHTML = Utils.formatCurrency(Transaction.incomes()) 
        document.querySelector("#expenseDisplay").innerHTML = Utils.formatCurrency(Transaction.expenses())
        document.querySelector("#totalDisplay").innerHTML = Utils.formatCurrency(Transaction.total())
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
    }
}

const Form = { 
    description: document.querySelector("#description"),
    amount: document.querySelector("#amount"),
    date: document.querySelector("#date"),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },

    //Verifica se não são vazios
    validateFields() {
        //Estamos pegando cada constante de dentro do objeto retornado em getValues
        const {description, amount, date} = Form.getValues()

        if (description.trim() === "" || amount.trim() === "" || date.trim() === "") {
            throw new Error("Por favor, preencha todos os campos.")
        }
    },

    //Formatando os valores de AMOUNT e DATE
    formatValues() {
        let {description, amount, date} = Form.getValues()

        //Formata o valor
        amount = Utils.formatAmount(amount)

        //Formata a data para DIA/MÊS/ANO
        date = Utils.formatDate(date)
       
        //Quando o nome dos atributos e valores são os mesmos, podemos apenas colocar 
        //o nome uma vez que já será entendido pelo JS
        return {
            description,
            amount,
            date
        }
    },

    saveTransaction(transaction) {
        Transaction.add(transaction)        
    },

    //Irá limpar os nossos campos do formulário
    clearFields() {
        Form.description.value = "",
        Form.amount.value = "",
        Form.date.value = ""
    },

    //Ao receber o evento do form, estamos utilizando o evento aqui em baixo
    submit(event) {
        try {
            /**Não deixa o formulário enviar os dados pela URL */
            event.preventDefault()
            //Verificar se todas as informações foram preenchidas
            Form.validateFields()
            //Formatar os dados para salvar. Retorna a transação com os dados formatados
            const transaction = Form.formatValues()
            //Salvar
            Form.saveTransaction(transaction)
            //Apagar os dados do formulário
            Form.clearFields()
            //Fechar modal
            Modal.close()
            //Atualizar a aplicação          
        } catch (error) {
            alert(error.message)
        }  
    }
}

const App  = {
    //carrega tudo
    init() {
        //Estamos percorrendo todo o nosso array de transactions e colocando cada transaction na nossa tabela HTML
        //O INDEX (POSIÇÃO DE CADA TRANSACTION) VEM AUTOMATICAMENTE PELO FOR EACH 
        Transaction.all.forEach(function (transaction, index) {
            DOM.addTransaction(transaction, index)
        })  

        //Estamos percorrendo todo o nosso array de transactions, calculando as entradas, calculando as saídas e calculando o total
        DOM.updateBalance()
        
        //A princípio, o nosso Transaction.all é VAZIO.
        //Entretanto, depois de adicionar uma nova transação no Transaction.all, iremos atualizar no local storage
        //Ao remover uma transação do nosso Transaction.all, iremos atualizar novamente no local storage
        Storage.set(Transaction.all)
    },
    reload() {
        //limpa a tabela e carrega tudo de novo
        DOM.clearTransactions()
        App.init()
    }
}


App.init()

