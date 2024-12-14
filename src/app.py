from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate
from datetime import datetime
from sqlalchemy import desc, text
from decouple import config
from sqlalchemy.exc import OperationalError

app = Flask(__name__)

app.config['SECRET_KEY'] = config('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = config('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = config('SQLALCHEMY_TRACK_MODIFICATIONS')

db = SQLAlchemy(app)
migrate = Migrate(app, db)

@app.route('/test_db')
def test_db():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({"status":"success", "message": "Conection to the database is successfull"}), 200
    except OperationalError as e:
        return jsonify({"status": "error", "message":"Failed to connect to the database", "details": str(e)}), 500

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    correo = db.Column(db.String(120), unique=True, nullable=False)
    contrasena = db.Column(db.String(200), nullable=False)
    
    def __repr__(self):
        return f'<Usuario {self.nombre}>'

class Tiempo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    tiempo = db.Column(db.Float, default=0.0)
    usuario = db.relationship('Usuario', backref=db.backref('tiempos', lazy=True))
    
    def __repr__(self):
        return f'<Tiempo {self.id} - Usuario {self.usuario.nombre}>'   

class Estudio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    fecha_inicio = db.Column(db.DateTime, nullable=False)
    fecha_fin = db.Column(db.DateTime, nullable=False)
    resumen = db.Column(db.Text, nullable=False)
    usuario = db.relationship('Usuario', backref=db.backref('estudios', lazy=True))
    
    def __repr__(self):
        return f'<Estudio {self.id} - Usuario {self.usuario.nombre}>'
        
class Uso(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    fecha_inicio = db.Column(db.DateTime, nullable=False)
    fecha_fin = db.Column(db.DateTime, nullable=False)
    usuario = db.relationship('Usuario', backref=db.backref('usos', lazy=True))
    
    def __repr__(self):
        return f'<Uso {self.id} - Usuario {self.usuario.nombre}>'

@app.route("/save_use", methods=["POST"])
def save_use():
    data = request.get_json()
    
    start = data.get('start')
    end = data.get('end')
    time = data.get('time')
      
    usuario_id = session.get("usuario_id")

    fecha_inicio = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
    fecha_fin = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")

    uso = Uso(
        usuario_id=usuario_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
    )
    db.session.add(uso)
    
    tiempo = Tiempo.query.filter_by(usuario_id=usuario_id).first()
    tiempo.tiempo = time
    print('que pasa3')
    db.session.add(tiempo)

    db.session.commit()
    
    return jsonify({'redirect': url_for('perfil')})
    
@app.route("/save_study", methods=["POST"])
def save_study():
    data = request.get_json()
    
    start = data.get('start')
    end = data.get('end')
    summary = data.get('summary')
    time = data.get('time')
    
    usuario_id = session.get("usuario_id")

    fecha_inicio = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
    fecha_fin = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")

    estudio = Estudio(
        usuario_id=usuario_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        resumen=summary
    )
    db.session.add(estudio)
    
    tiempo = Tiempo.query.filter_by(usuario_id=usuario_id).first()
    
    if tiempo:
            tiempo.tiempo += time
    else:
        tiempo = Tiempo(
            usuario_id=usuario_id,
            tiempo=time
        )
        db.session.add(tiempo)

    db.session.commit()
    
    return jsonify({'redirect': url_for('perfil')})
    
    # return jsonify({
    #     'status': 'success',
    #     'start': start,
    #     'end': end,
    #     'summary': summary,
    #     'time': time
    #     }), 200
    

@app.route("/cancel", methods=["GET"])
def cancel():
    return redirect(url_for('perfil'))


@app.route("/add_time")
def add_time():
    if "usuario_id" not in session:
        return redirect(url_for("login"))
    
    return render_template("add_time.html")

@app.route("/use_time")
def use_time():
    if "usuario_id" not in session:
        return redirect(url_for("login"))
    
    usuario_id = session.get("usuario_id")
    tiempo = Tiempo.query.filter_by(usuario_id=usuario_id).first()
    tiempo_valor = tiempo.tiempo if tiempo else 0
    
    return render_template("use_time.html", tiempo=tiempo_valor)
    
@app.route("/registro")
def registro():
    return render_template("registro.html")

@app.route("/registrar_usuario", methods=["POST"])
def registrar_usuario():
    nombre = request.form["nombre"]
    email = request.form["email"]
    contrasena = request.form["contrasena"]
    repetir_contrasena = request.form["repetir_contrasena"]
    
    if contrasena != repetir_contrasena:
        return "Las contraseñas no coinciden, intenta nuevamente."
    
    if Usuario.query.filter_by(correo=email).first():
        return "El correo ya está registrado, intenta con otro."
    
    contrasena_hash = generate_password_hash(contrasena)
    
    nuevo_usuario = Usuario(nombre=nombre, correo=email, contrasena=contrasena_hash)
    db.session.add(nuevo_usuario)
    db.session.commit()
    
    return redirect(url_for("login"))
    
@app.route("/usuarios")
def mostrar_usuarios():
    usuarios = Usuario.query.all()
    return '<br>'.join([f'{usuario.nombre} ({usuario.correo})' for usuario in usuarios])

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        correo = request.form["correo"]
        contrasena = request.form["contrasena"]
        
        usuario = Usuario.query.filter_by(correo=correo).first()
        
        if usuario and check_password_hash(usuario.contrasena, contrasena):
            session["usuario_id"] = usuario.id
            session["usuario_nombre"] = usuario.nombre
            return redirect(url_for("perfil"))
        else:
            return "Correo o contraseña incorrectos."
    return render_template("login.html")

@app.route("/perfil")
def perfil():
    if "usuario_id" not in session:
        return redirect(url_for("login"))
    
    usuario_id = session["usuario_id"]
    usuario_nombre = session["usuario_nombre"]
    
    estudios = Estudio.query.filter_by(usuario_id=usuario_id).order_by(desc(Estudio.id)).all()
      
    return render_template("perfil.html", id=usuario_id, nombre=usuario_nombre, estudios=estudios)

@app.route("/logout")
def logout():
    session.pop("usuario_id", None)
    session.pop("usuario_nombre", None)
    return redirect(url_for("home"))

@app.route("/")
def home():
    return render_template("login.html")

if __name__ == "__main__":
    # with app.app_context():
    #     db.create_all()
    app.run(debug=False)
    