import { logoutUser } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutUser}>
      <button className="btn ghost !mb-0" type="submit">
        Log out
      </button>
    </form>
  );
}
