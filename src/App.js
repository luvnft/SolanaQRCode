import React, { useState, useEffect } from "react";
import { Connection, PublicKey, clusterApiUrl, Transaction, SystemProgram } from '@solana/web3.js';
import productsData from "./products.json";
import axios from 'axios';
import './styles.css';  // Import the CSS file
import { useWallet } from '@solana/wallet-adapter-react';

const App = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(0);
  const wallet = useWallet(); // Get wallet info

  // Load products from JSON file
  useEffect(() => {
    setProducts(productsData);
    fetchExchangeRate(); // Fetch the exchange rate on component mount
  }, []);

  // Function to fetch exchange rate from an API
  const fetchExchangeRate = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      setExchangeRate(response.data.solana.usd); // Get exchange rate for SOL in USD
      console.log("Current Exchange Rate (USD to SOL):", response.data.solana.usd); // Log the exchange rate
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  // Convert price from USD to SOL
  const convertToSOL = (usdPrice) => {
    return usdPrice / exchangeRate; // Convert USD to SOL
  };

  // Add product to cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find(item => item.id === product.id);
      if (existingProduct) {
        // If the product exists, increment the quantity
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Otherwise, add a new product with quantity 1
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Clear the cart
  const clearCart = () => {
    setCart([]); // Clear the cart
  };

  // Handle Solana Payment
  const handlePayment = async () => {
    if (!wallet.connected) {
      alert("Please connect your wallet first!");
      return;
    }

    const totalAmount = cart.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    console.log("Total Amount in USD:", totalAmount); // Log total amount in USD

    // Convert total amount from USD to SOL
    const totalAmountInSOL = convertToSOL(totalAmount);
    console.log("Total Amount in SOL:", totalAmountInSOL); // Log total amount in SOL

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log("Wallet Balance (SOL):", balance / 1e9); // Display balance in SOL
    if (balance < totalAmountInSOL * 1e9) {
      alert("Insufficient funds in your wallet!");
      return;
    }

    // Convert SOL to lamports and ensure it's an integer using Math.floor
    const lamportsToSend = Math.floor(totalAmountInSOL * 1e9);

    console.log("Total Amount in Lamports:", lamportsToSend); // Log total amount in lamports

    // Check if lamportsToSend is a valid number
    if (isNaN(lamportsToSend) || lamportsToSend <= 0) {
      alert("Invalid amount to send!");
      return;
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey("63XcsTWCbYXQRBWw7dHVU496XUGHEbwHi62rrts3HLc3"), // Replace with your receiver's public key
        lamports: lamportsToSend,
      })
    );

    try {
      const signature = await wallet.sendTransaction(transaction, connection);
      console.log("Transaction signature", signature);

      // Updated: Using an options object for confirmTransaction
      const options = {
        commitment: 'confirmed', // Can be 'finalized' or 'confirmed'
      };
      const confirmation = await connection.confirmTransaction(signature, options);

      console.log("Transaction confirmation", confirmation);
      alert("Payment successful!");

      // Clear the cart after successful payment
      clearCart();
    } catch (error) {
      console.error("Payment failed", error);
      alert("Payment failed: " + error.message);
    }
  };


  return (
    <div className="app-container">
      <header>
        <img src="logo.png" alt="Company Logo" className="logo" />
      </header>

      <div className="product-list">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            <img src={product.imageUrl} alt={product.name} className="product-img" />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="price">${product.price.toFixed(2)} / {(convertToSOL(product.price)).toFixed(4)} SOL</p>
            <button className="add-btn" onClick={() => addToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>

      <div className="cart-container">
        <h2>Your Cart</h2>
        <div className="cart">
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            cart.map((item, index) => (
              <div key={index} className="cart-item">
                <p>
                  <span className="product-name">{item.name}</span> - ${item.price} x {item.quantity} - {(convertToSOL(item.price * item.quantity)).toFixed(4)} SOL
                </p>
              </div>
            ))
          )}
          <h3>
            Total: ${cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)} - {(convertToSOL(cart.reduce((acc, item) => acc + item.price * item.quantity, 0))).toFixed(4)} SOL
          </h3>
          {cart.length > 0 && (
            <div>
              <button className="checkout-btn" onClick={handlePayment}>Proceed to Checkout with Solana</button>
              <button className="clear-btn" onClick={clearCart}>Clear Orders</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
