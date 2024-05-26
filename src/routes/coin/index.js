//GET Route for individual coin route
export default async function (fastify, opts) {
  fastify.get("/price/", async function (request, reply) {
    //Array with the top 5 five coin solana by marketcap
    const topCoinsToQuery = [
      "So11111111111111111111111111111111111111112",
      "6D7NaB2xsLd7cauWu1wKk6KBsJohJmP2qZH9GEfVi5Ui",
      "5mbK36SZ7J19An8jFochhQS4of8g6BwUjbeCSxBSoWdp",
      "7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3",
      "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv",
    ];

    return jupPriceApi(topCoinsToQuery, fastify);
  });

  fastify.get("/price/:tokenId", function (request, reply) {
    const { tokenId } = request.params;
    const coinToQuery = [tokenId];

    //Promise that return the coin price from JUP
    return jupPriceApi(coinToQuery, fastify);
  });

  // GET tokenInfo Collection
  fastify.get("/data/list/", async function (request, reply) {
    const collection = fastify.mongo.db.collection("tokenInfo");
    const tokensData = await collection.find().toArray();

    reply.send(tokensData);
  });

  // POST add a token inside tokenInfo Collection
  fastify.post("/data/add/", async function (request, reply) {

    //parse the json data inside the const
    const { tokenPublicID, tokenName } = request.body;

    //Validate that are not undefined
    if (tokenPublicID && tokenName) {
      const collection = fastify.mongo.db.collection("tokenInfo");
      //Insert a document in the collection
      const result = await collection.insertOne({ tokenPublicID, tokenName });
      reply.send({ success: true, id: result.insertedId });
    } else {
      reply.send({ msg: "no token information sended" });
    }
  });
}

//Fetch the coin price with tokenId on Solana
async function jupPriceApi(tokenId, fastify) {
  var jupAPI = "https://price.jup.ag/v4/price?ids=";
  tokenId.forEach((element) => {
    jupAPI = jupAPI + "," + element;
  });

  // Fetch to  JUP API
  var finalCoinPrice = fetch(jupAPI)
    .then((response) => response.json())

    .then(async (responseJSON) => {
      const coin = responseJSON.data;

      // console.log(coin)

      var coinPrice = [];
      const keys = Object.keys(coin);

      const collection = fastify.mongo.db.collection("tokenInfo");

      for (const key of keys) {
        const resultado = await collection
          .find({ tokenPublicID: coin[key].id })
          .toArray();
        // Verificar si resultado[0] y resultado[0].tokenName están definidos
        if (resultado[0] && resultado[0].tokenName) {
          coinPrice.push(resultado[0].tokenName + ":" + coin[key].price);
        } else {
          // Manejar el caso en que tokenName es indefinido
          coinPrice.push(coin[key].mintSymbol + ":" + coin[key].price);
        }
      }

      return coinPrice;
    })

    .catch((err) => {
      // Error handler
      console.error("Error al realizar la solicitud:", err);
      return err;
    });

  return finalCoinPrice;
}