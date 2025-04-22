import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { opend } from "../../../declarations/opend";
import Button  from "./Button";
import { Principal } from "@dfinity/principal";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

function Item(props) {

  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [image, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoader] = useState(true);
  const [isblurred, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState();
  const [priceLabel, setPriceLabel] = useState();
 

  const id = typeof props.id === "string" ? Principal.fromText(props.id) : props.id;
  
  const localHost = "http://localhost:8080/"
  const agent = new HttpAgent({ host: localHost });
  // Remove after live deploy
  agent.fetchRootKey();
  let NFTActor;
 
  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    });

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(
      new Blob([imageContent.buffer], { type: "image/png" })
    );
    setName(name);
    setOwner(owner.toText());
    setImage(image);
    if (props.role == "Collection") {
      const nftIsListed = await opend.isListed(id);
        if (nftIsListed) {
          setOwner("OPEND"); 
          setBlur({filter: 'blur(5px)'});
          setSellStatus("Listed")
        } else {
          setButton(<Button handleClick={handleSell} text="Sell"/>);
        };  
    } else if (props.role == "Discover") {
      const originalOwner = await opend.getOriginalOwner(props.id);
      if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
      setButton(<Button handleClick={handleBuy} text="Buy"/>);
      };

      const price = await opend.getListedNFTOwner(props.id);
      setPriceLabel(<PriceLabel sellPrice={price.toString()} />);
    };
  }
  useEffect(() => {
    loadNFT();
  }, []);

  let price;
  function handleSell() {
    console.log("button clicked");
    setPriceInput(<input
      placeholder="Price in DANG"
      type="number"
      className="price-input"
      value={price}
      onChange={(e)=> (price = e.target.value)}
      />
    );
      
    setButton(<Button handleClick={sellItem} text="Confirm"/>); 
    
  };
  
  async function sellItem() {
    setBlur({filter: 'blur(5px)'});
    setLoader(false);
    console.log("set price " + price);
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log("Listing " + listingResult);
    if (listingResult == "Success") {
      const openDId = await opend.getOpenDCanisterID();
      const transferResult = await NFTActor.transferOwnership(openDId);
      console.log("Transfer " + transferResult);
      if (transferResult == "Success") {
        setLoader(true);
        setButton();
        setPriceInput();
        setOwner("OPEND");  
        setSellStatus("Listed") 
      }
    } else {
      setLoader(true);
      setButton();
      setPriceInput();
    }
      
  };

  async function handleBuy() {
    console.log("Buy  has been triggered");
    
  }

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={isblurred}
        />
        <div hidden={loaderHidden} className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
        <div className="disCardContent-root">
        {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
