import React,{useContext, useEffect} from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Menu from './components/Menu';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Wallets from './components/Wallets';
import Categories from './components/Categories';
import GiveFeedback from './components/GiveFeedback';
import ReportBug from './components/ReportBug';
import AddSubscriptionModal from './components/AddSubscriptionModal';
import LimitByCategoryModal from './components/LimitByCategoryModal';
import AddTransaction from "./components/AddTransaction";
import AddWalletModal from "./components/AddWalletModal"
import SubscriptionTransfer from './components/SubscriptionTransfer';
import LandingPage from "./components/LandingPage"
import AppContext from './context/AppContext';
import DeleteWalletConfirmation from './components/DeleteWalletConfirmation';
import AddCategoryModal from "./components/AddCategoryModal"
import LandingModal from "./components/LandingModal"
import Protected from './components/Protected';

function App() {

  const {showLimitsModal,
        setShowLimitsModal,
        showSubscriptionModal,
        setShowSubscriptionModal,
        showAddTransactionModal,
        setShowAddTransactionModal,
        showConfirmSubscriptionTransfer,
        showAddWallet,
        setShowAddWallet,
        showAddCategoryModal,
        setShowAddCategoryModal,
        showDeleteWalletConfirmation,
        setShowDeleteWalletConfirmation,
        showMenu,
        setShowMenu,
        showLandingModal,
        setShowLandingModal
        } = useContext(AppContext);

        useEffect(()=>{
          setShowLandingModal(localStorage.getItem("LandingModalValue"));
        },[])

  return (
    <Router>
      <div className="grand--div">
        <Routes>
          <Route path="/" element={<LandingPage/>} />
          <Route element={<Protected/>}>
            <Route path="/dashboard" element={<div className='grand--parent--div'><Menu/><Dashboard /></div>} />
            <Route path="/wallets/:id" element={<div className='grand--parent--div'><Menu/><Wallets /></div>} />
            <Route path="/categories" element={<div className='grand--parent--div'><Menu/><Categories /></div>} />
            <Route path="/settings" element={<div className='grand--parent--div'><Menu/><Settings /></div>} />
            <Route path="/give-feedback" element={<div className='grand--parent--div'><Menu/><GiveFeedback /></div>} />
            <Route path="/report-bug" element={<div className='grand--parent--div'><Menu/><ReportBug /></div>} />
          </Route>
        </Routes>
        {showLandingModal && <LandingModal/>}
        {showLimitsModal && <LimitByCategoryModal/>}
        {showSubscriptionModal && <AddSubscriptionModal/>}
        {showAddTransactionModal && <AddTransaction/>}
        {/* {showConfirmSubscriptionTransfer && <SubscriptionTransfer/>} */}
        {showAddWallet && <AddWalletModal/>}
        {showAddCategoryModal && <AddCategoryModal/>}
        {/* {showDeleteWalletConfirmation && <DeleteWalletConfirmation/>} */}
      </div>
    </Router>
  );
}

export default App;
