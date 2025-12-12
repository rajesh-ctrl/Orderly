import { stackServerApp } from "@/stack/server";
import { UserButton } from "@stackframe/stack";

export default async function Page() {
  const user = await stackServerApp.getUser();
  return (
    <div>
      {user ? (
        <div>
          <UserButton />
          <p>Welcome, {user.displayName ?? "unnamed user"}</p>
          <p>Your e-mail: {user.primaryEmail}</p>
          <p>
            <a href={stackServerApp.urls.signOut}>Sign Out</a>
          </p>
        </div>
      ) : (
        <div>
          <p>You are not logged in</p>
          <p>
            <a href={stackServerApp.urls.signIn}>Sign in</a>
          </p>
          <p>
            <a href={stackServerApp.urls.signUp}>Sign up</a>
          </p>
        </div>
      )}
    </div>
  );
}
