import { logoutUser } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutUser}>
      <button className="btn ghost mt-3.5" type="submit">
        Log out
      </button>
    </form>
  );
}
