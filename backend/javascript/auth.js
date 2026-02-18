function validarEmail(email) {
    const padroes = ['gmail','hotmail','outlook','yahoo','icloud']

    for(const padrao of padroes){

        if (email.includes("@") && email.includes(".com") && email.includes(padrao)) {
            return true; 
        }
    }
    return false;
}

function validarSenha(senha) {

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,12}$/;
    let validacao = regex.test(senha)

    if (validacao == true) {
        return true
    }
    else {
        return false
    }
}

function validarCaracteres(username, email, senha) {

    let verificacao = true;
    
    const padroesPerigosos = [
        "'", '"', ';', '--', '#', '/*', '*/', '\\',
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP',
        'ALTER', 'UNION', 'EXEC', 'CREATE', 'TRUNCATE',
        'INTO', 'TABLE', 'DATABASE'
    ];


    for (let i = 0; i < padroesPerigosos.length; i++) {
        if (username.includes(padroesPerigosos[i])) {
            return true
        }
        else {
            verificacao = false
        }
    }

    if (verificacao == false) {
        for (let i = 0; i < padroesPerigosos.length; i++) {
            if (email.includes(padroesPerigosos[i])) {
                return true

            }
            else {
                verificacao = false
            }
        }

    }

    if (verificacao == false) {
        for (let i = 0; i < padroesPerigosos.length; i++) {
            if (senha.includes(padroesPerigosos[i])) {
                return true

            }
            else {
                return false
            }
        }
    }





}


module.exports = { validarEmail, validarSenha, validarCaracteres}



