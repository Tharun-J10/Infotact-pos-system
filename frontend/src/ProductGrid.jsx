import React from 'react';
import { motion } from 'framer-motion';

// ✨ Animation settings for the stagger effect
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const ProductGrid = ({ products, onAddToCart, formatINR }) => {
  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
    >
      {products.map((product) => (
        <motion.div 
          key={product._id} 
          variants={item}
          whileHover={{ y: -12, scale: 1.03 }}
          className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(31,38,135,0.07)] border border-white/80 flex flex-col items-center text-center group transition-shadow hover:shadow-[0_20px_50px_rgba(31,38,135,0.15)]"
        >
          {/* ✨ Glowing background blob behind the item */}
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-2xl -z-10 group-hover:opacity-100 transition-opacity opacity-60"></div>
          
          {/* ✨ Smart Image Render ✨ */}
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-32 h-32 object-contain mb-6 drop-shadow-xl transform group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300 relative z-10"
            />
          ) : (
            <div className="text-6xl mb-6 bg-white/80 w-28 h-28 flex items-center justify-center rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.05)] transform group-hover:-translate-y-2 group-hover:rotate-12 transition-transform duration-300 border border-white relative z-10">
              📦
            </div>
          )}
          
          <h3 className="text-xl font-extrabold text-gray-800 mb-1 leading-tight">{product.name}</h3>
          <p className="text-xs text-purple-600 uppercase tracking-widest mb-6 font-black bg-purple-100/50 px-3 py-1 rounded-full">{product.category}</p>
          
          <div className="mt-auto w-full pt-5 border-t border-gray-200/50 flex flex-col items-center">
            <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-5 tracking-tight">
              {formatINR(product.price)}
            </p>
            
            <button 
              className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-wide transition-all duration-300 active:scale-[0.95] ${
                product.stock <= 0 
                  ? 'bg-gray-200/50 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_25px_rgba(99,102,241,0.4)]'
              }`}
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
            >
              {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductGrid;