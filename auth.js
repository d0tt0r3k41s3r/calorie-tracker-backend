import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_jwt_changeme";
const USERS_FILE = "users.json";

// Cargar o crear archivo de usuarios
export function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
        return [];
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data || "[]");
}

export function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Middleware de autenticación
export function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ error: "Token no proporcionado" });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido" });
        }
        req.user = user;
        next();
    });
}

// Controlador de registro
export async function registerUser(req, res) {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son requeridos" });
        }
        
        const users = loadUsers();
        const userExists = users.find(u => u.email === email);
        
        if (userExists) {
            return res.status(400).json({ error: "El usuario ya existe" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: users.length + 1,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveUsers(users);
        
        res.status(201).json({ message: "Usuario registrado exitosamente", userId: newUser.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error registrando usuario" });
    }
}

// Controlador de login
export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son requeridos" });
        }
        
        const users = loadUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "24h"
        });
        
        res.json({ token, userId: user.id, email: user.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el login" });
    }
}

// Obtener información del usuario autenticado
export async function getUserInfo(req, res) {
    try {
        const users = loadUsers();
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        res.json({ id: user.id, email: user.email, createdAt: user.createdAt });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error obteniendo información del usuario" });
    }
}
