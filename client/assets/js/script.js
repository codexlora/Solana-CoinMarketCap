document.addEventListener("DOMContentLoaded", (event) => {
  GetPrices();
  GetTokens();
  setInterval(GetPrices, 5000);
});

async function GetPrices() {
  const request = await fetch("http://127.0.0.1:4000/coin/price/");
  const prices = await JSON.parse(await request.text());

  if (document.querySelector(".trending-coins ul"))
    document.querySelector(".trending-coins ul").remove();

  const ul = document.createElement("ul");

  for (const token of prices) {
    ul.insertAdjacentHTML("beforeend", `<li>${token}</li>`);
  }

  document
    .querySelector(".trending-coins")
    .insertAdjacentElement("afterbegin", ul);
}

async function GetTokens() {
  const request = await fetch("http://127.0.0.1:4000/coin/data/list/");
  const tokens = await JSON.parse(await request.text());

  if (document.querySelector(".stored-coins ul"))
    document.querySelector(".stored-coins ul").remove();

  const ul = document.createElement("ul");

  for (const token in tokens) {
    ul.insertAdjacentHTML(
      "beforeend",
      `<li>${tokens[token].tokenName} : ${tokens[token].tokenPublicID}</li>`
    );
  }

  document
    .querySelector(".stored-coins")
    .insertAdjacentElement("afterbegin", ul);
}