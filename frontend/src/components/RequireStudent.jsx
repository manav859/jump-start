import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ADMIN_HOME = "/admin/dashboard";

/**
 * Keeps admins out of the student tree.
 *
 * Student pages fetch through /v1/user/*, which scopes to the JWT holder —
 * so an admin who followed student nav saw their OWN empty account
 * ("Welcome Jumpstart Admin, 0 tests", "complete your student profile")
 * with no route back to /admin. This redirects them to their own dashboard
 * instead. `replace` so it does not add a history entry to back through.
 *
 * IMPORTANT — scope: this wraps routes in the STUDENT tree only. The admin
 * report route (/admin/testsubmissions/:reportId/report) renders the same
 * StudentReport component but belongs to the /admin tree and is deliberately
 * NOT wrapped; guarding it would make student reports unviewable by admins,
 * which is the opposite of what we want.
 *
 * Auth itself is untouched — no token, session or role is read or written
 * here beyond reading the already-loaded role. Students and logged-out
 * visitors fall straight through.
 */
export default function RequireStudent({ children }) {
  const { user } = useContext(AuthContext);

  // AuthContext seeds `user` synchronously from localStorage, so the role is
  // known on the first render. Gating on `loading` would blank public pages
  // for a frame without making the decision any more correct.
  if (user?.role === "admin") {
    return <Navigate to={ADMIN_HOME} replace />;
  }

  return children;
}
