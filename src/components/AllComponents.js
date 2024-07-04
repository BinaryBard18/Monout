import React from "react";
import Menu from "./Menu";
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Menu from './components/Menu';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Wallets from './components/Wallets';
import Categories from './components/Categories';
import GiveFeedback from './components/GiveFeedback';
import ReportBug from './components/ReportBug';

export default function AllComponents(){
    return (
        <div className="grand--div">
            <Menu/>
            <Routes>
          <Route element={<Protected/>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/give-feedback" element={<GiveFeedback />} />
            <Route path="/report-bug" element={<ReportBug />} />
          </Route>
        </Routes>
        </div>
    )
}