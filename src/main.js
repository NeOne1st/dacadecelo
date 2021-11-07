import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import mentorMeABI from "../contracts/mentorme.json";
import erc20Abi from "../contracts/erc20.abi.json";

const ERC20_DECIMALS = 18;
const MPContractAddress = "0x178134c92EC973F34dD0dd762284b852B211CFC8";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit;
let contract;
let creators = [];

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();
      notificationOff();

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(mentorMeABI, MPContractAddress);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount });
  return result;
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.querySelector("#balance").textContent = cUSDBalance;
};

const getProducts = async function () {
  const _productsLength = await contract.methods.getProductsLength().call();
  const _products = [];
  for (let i = 0; i < _productsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readProduct(i).call();
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        image: p[2],
        description: p[3],
        location: p[4],
        supporters: new BigNumber(p[5]),
        supported: p[6],
      });
    });
    _creators.push(_creator);
  }
  products = await Promise.all(_creators);
  renderCreators();
};

function renderCreators() {
  document.getElementById("MentorMe").innerHTML = "";
  products.forEach((_product) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = productTemplate(_product);
    document.getElementById("MentorMe").appendChild(newDiv);
  });
}

function CreatorTemplate(_creator) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_product.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${_creator.supported} supported
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_creator.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_creator.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_creator.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_creator.location}</span>
        </p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${
            _creator.index
          }>
            Buy for ${_creator.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
          </a>
        </div>
      </div>
    </div>
  `;
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `;
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getProducts();
  notificationOff();
});

document.querySelector("#newMentorBtn").addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newMentorName").value,
    document.getElementById("newImgUrl").value,
    document.getElementById("newMentorDescription").value,
    document.getElementById("newLocation").value,
    new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString(),
  ];
  notification(`⌛ Adding "${params[0]}"...`);
  try {
    const result = await contract.methods
      .writeProduct(...params)
      .send({ from: kit.defaultAccount });
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
  notification(`🎉 You successfully mentored "${params[0]}".`);
  getProducts();
});

document.querySelector("#MentorMe").addEventListener("click", async (e) => {
  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id;
    notification("⌛ Waiting for payment approval...");
    try {
      await approve(products[index].price);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
    notification(`⌛ Awaiting Mentoring for "${creators[index].name}"...`);
    try {
      const result = await contract.methods
        .buyCreator(index)
        .send({ from: kit.defaultAccount });
      notification(`🎉 You successfully supported "${products[index].name}".`);
      getProducts();
      getBalance();
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  }
});
