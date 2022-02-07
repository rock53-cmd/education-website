import { Suspense } from "react";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { Flex } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import useToast from "./hooks/useToast";
import useSettings from "./hooks/useSettings";

import config from "./config";

// actions
import { LOGIN, LOGOUT, ORG_LOGIN } from "./redux/actions/authActions";

// components
import ProtectedRoute from "./components/global/ProtectedRoute";
import AdminRoute from "./components/global/AdminRoute";
import OrgProtectedRoute from "./components/global/OrgProtectedRoute";

// pages
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Registration from "./pages/Registration";
import OrgDashboard from "./pages/OrgDashboard";

import enTrans from "./locales/enTrans";
import esTrans from "./locales/esTrans";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: enTrans },
      es: { translation: esTrans },
    },
    lng: localStorage.getItem("locale") ? JSON.parse(localStorage.getItem("locale")) : "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

const App = () => {
  const [pending, setPending] = useState(true);
  const dispatch = useDispatch();
  const toast = useToast();
  const getSettings = useSettings();
  const abortController = new AbortController();

  // for checking if the user is authenticated or not
  async function checkAuthStatus(abortController) {
    try {
      const res = await fetch(`${config.serverURL}/get_auth/checkLogin`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: abortController.signal,
      });
      const body = await res.json();

      if (res.status) {
        setPending(false);
      }

      if (res.ok) {
        // if there is a affiliateLink property that means it's an org object
        if (body.affiliateLink) {
          dispatch(ORG_LOGIN(body));
        } else {
          dispatch(LOGIN(body));
        }
      } else {
        dispatch(LOGOUT());
      }
    } catch (err) {
      dispatch(LOGOUT());
      toast({ status: "error", description: err.message });
    }
  }

  useEffect(() => {
    checkAuthStatus(abortController);

    getSettings(abortController);

    localStorage.setItem("chakra-ui-color-mode", JSON.stringify("light"));

    return () => abortController.abort();
  }, []);

  // if the server response is pending this spinner should be shown
  if (pending) {
    return (
      <Flex h="100vh" justify="center" align="center">
        <Spinner colorScheme="primary" />
      </Flex>
    );
  }

  return (
    <Suspense fallback="Loading...">
      <BrowserRouter>
        <Switch>
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <OrgProtectedRoute path="/orgDashboard" component={OrgDashboard} />
          <AdminRoute path="/admin" component={Admin} />
          <Route path="/auth" component={Registration} />
          <Redirect path="*" to="/auth" />
        </Switch>
      </BrowserRouter>
    </Suspense>
  );
};

export default App;
