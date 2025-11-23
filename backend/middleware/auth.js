const jwt = require('jsonwebtoken');


//Middleware para verificar se o token JWT fornecido é válido e se o usuário é um administrador.

function protect(req, res, next) {
    // 1. O token geralmente é enviado no cabeçalho 'Authorization' como 'Bearer TOKEN'
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // 2. Verifica se o token existe
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acesso negado. Token não fornecido.' 
        });
    }

    try {
        // 3. Verifica e decodifica o token usando a chave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Anexa a informação do usuário (incluindo a role 'admin') à requisição
        req.user = decoded; 
        
        // 5. Permite que a requisição siga para a rota
        next(); 
        
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token inválido ou expirado.' 
        });
    }
}

module.exports = { protect };