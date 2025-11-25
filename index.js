import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

const app = express();
const porta = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "segredo123",
    resave: false,
    saveUninitialized: false,
  })
);

let produtos = [];

function pagina(titulo, conteudo) {
  return `
  <html>
  <head>
      <title>${titulo}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>

  <body class="bg-light">

      <div class="container mt-5">
          <div class="card shadow-lg">
              <div class="card-body">
                  ${conteudo}
              </div>
          </div>
      </div>

  </body>
  </html>
  `;
}

function verificaLogin(req, res, next) {
  if (req.session.usuario) next();
  else
    res.send(
      pagina(
        "Login necessário",
        `
      <h2 class="text-center mb-4">Você precisa realizar login</h2>
      <div class="text-center">
        <a href="/login" class="btn btn-primary">Ir para o Login</a>
      </div>
      `
      )
    );
}

app.get("/", (req, res) => {
  res.send(
    pagina(
      "Início",
      `
      <h1 class="text-center mb-4">Bem-vindo ao Sistema</h1>

      <div class="d-grid gap-2 col-6 mx-auto">
        <a href="/login" class="btn btn-primary">Fazer Login</a>
        <a href="/produtos" class="btn btn-success">Cadastro de Produtos</a>
      </div>
      `
    )
  );
});

app.get("/login", (req, res) => {
  res.send(
    pagina(
      "Login",
      `
      <h2 class="text-center mb-4">Login</h2>

      <form method="POST" action="/login" class="col-md-6 mx-auto">

          <div class="mb-3">
              <label class="form-label">Usuário</label>
              <input type="text" name="usuario" class="form-control">
          </div>

          <div class="mb-3">
              <label class="form-label">Senha</label>
              <input type="password" name="senha" class="form-control">
          </div>

          <button type="submit" class="btn btn-primary w-100">Entrar</button>
      </form>
      `
    )
  );
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario && senha) {
    req.session.usuario = usuario;

    const agora = new Date().toLocaleString();
    res.cookie("lastAccess", agora, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.redirect("/produtos");
  } else {
    res.send(
      pagina(
        "Erro",
        `
        <h2 class="text-center text-danger">Usuário ou senha inválidos!</h2>
        <div class="text-center mt-3">
            <a href="/login" class="btn btn-primary">Tentar novamente</a>
        </div>
        `
      )
    );
  }
});

app.get("/produtos", verificaLogin, (req, res) => {
  const ultimoAcesso = req.cookies.lastAccess || "Primeiro acesso";

  let tabela =
    produtos.length === 0
      ? `<p class="text-center text-muted">Nenhum produto cadastrado ainda.</p>`
      : `
      <table class="table table-bordered table-striped mt-4">
          <thead class="table-dark">
              <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Custo</th>
                  <th>Venda</th>
                  <th>Validade</th>
                  <th>Estoque</th>
                  <th>Fabricante</th>
              </tr>
          </thead>
          <tbody>
              ${produtos
                .map(
                  (p) => `
                  <tr>
                      <td>${p.codigo}</td>
                      <td>${p.descricao}</td>
                      <td>R$ ${p.custo}</td>
                      <td>R$ ${p.venda}</td>
                      <td>${p.validade}</td>
                      <td>${p.estoque}</td>
                      <td>${p.fabricante}</td>
                  </tr>
              `
                )
                .join("")}
          </tbody>
      </table>
  `;

  res.send(
    pagina(
      "Cadastro de Produtos",
      `
      <h2 class="text-center mb-4">Cadastro de Produtos</h2>

      <p><b>Usuário logado:</b> ${req.session.usuario}</p>
      <p><b>Último acesso:</b> ${ultimoAcesso}</p>

      <form method="POST" action="/produtos" class="row g-3">

        <div class="col-md-6">
            <label class="form-label">Código de barras</label>
            <input class="form-control" name="codigo">
        </div>

        <div class="col-md-6">
            <label class="form-label">Descrição</label>
            <input class="form-control" name="descricao">
        </div>

        <div class="col-md-6">
            <label class="form-label">Preço de custo</label>
            <input type="number" step="0.01" class="form-control" name="custo">
        </div>

        <div class="col-md-6">
            <label class="form-label">Preço de venda</label>
            <input type="number" step="0.01" class="form-control" name="venda">
        </div>

        <div class="col-md-6">
            <label class="form-label">Data de validade</label>
            <input type="date" class="form-control" name="validade">
        </div>

        <div class="col-md-6">
            <label class="form-label">Estoque</label>
            <input type="number" class="form-control" name="estoque">
        </div>

        <div class="col-md-12">
            <label class="form-label">Fabricante</label>
            <input class="form-control" name="fabricante">
        </div>

        <div class="col-12">
            <button type="submit" class="btn btn-success w-100">Cadastrar produto</button>
        </div>

      </form>

      <h3 class="mt-4 text-center">Produtos cadastrados</h3>
      ${tabela}

      <div class="text-center mt-3">
        <a href="/logout" class="btn btn-danger">Logout</a>
      </div>
      `
    )
  );
});

app.post("/produtos", verificaLogin, (req, res) => {
  produtos.push(req.body);
  res.redirect("/produtos");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.send(
      pagina(
        "Logout",
        `
        <h2 class="text-center text-success">Logout realizado!</h2>
        <div class="text-center mt-3">
            <a href="/login" class="btn btn-primary">Entrar novamente</a>
        </div>
        `
      )
    );
  });
});

app.listen(porta, () =>
  console.log("Servidor rodando em http://localhost:" + porta)
);
