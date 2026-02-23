const welcomeEmailTemplate = (username) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(to right, #ec4899, #f97316); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenue sur MonPiedTonPied 👣</h1>
    </div>
    <div style="padding: 30px; background: white;">
      <h2>Bonjour ${username} !</h2>
      <p>Nous sommes ravis de vous accueillir sur <strong>MonPiedTonPied</strong>, la plateforme française dédiée aux passionnés de pieds.</p>
      <p>Commencez à explorer notre communauté dès maintenant :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/browse" style="background: linear-gradient(to right, #ec4899, #f97316); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block;">
          Découvrir la plateforme
        </a>
      </div>
    </div>
  </div>
`;