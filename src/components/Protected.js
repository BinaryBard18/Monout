import React,{useEffect} from "react";
import { Outlet, Navigate } from "react-router-dom";

export default function Protected() {
  const token = JSON.parse(localStorage.getItem("token"));
  // console.log("Token:", token); // Check if token is retrieved correctly

  return <>{token ? <Outlet /> : <Navigate to="/" />}</>;
}
