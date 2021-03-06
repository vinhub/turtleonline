<?php

namespace App\Controller;

use App\Entity\User;
use App\Model\EmailCredentials;
use App\Model\ResetPassword;
use App\Form\EmailCredentialsType;
use App\Form\UserRegisterType;
use App\Form\ResetPasswordType;
use App\Security\LoginFormAuthenticator;
use App\Service\Mailer;
use App\Service\UserManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Form\FormError;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Guard\GuardAuthenticatorHandler;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * Controller for security related routes (login, logout, register, forgot credentials).
 *
 * @Route("/")
 */
class SecurityController extends AbstractController
{
  /**
   * Route for signing in.
   *
   * @Route("/login", name="login")
   * @param Request $request
   * @param AuthenticationUtils $authenticationUtils
   * @return Response
   */
  public function login(Request $request, AuthenticationUtils $authenticationUtils): Response
  {
    // set the twig variables
    $twigs = [
      'last_username' => $authenticationUtils->getLastUsername(),
      'error' => $authenticationUtils->getLastAuthenticationError()
    ];

    // render and return the page
    return $this->render('security/login.html.twig', $twigs);
  }

  /**
   * Route for signing out.
   *
   * @Route("/logout", name="logout")
   */
  public function logout()
  {
    // this request is handled automatically by the symfony security service
  }

  /**
   * Route for registering on the site.
   *
   * @Route("/register", name="register")
   * @param GuardAuthenticatorHandler $guardHandler
   * @param Request $request
   * @param Mailer $mailer
   * @param UserManager $userManager
   * @return Response
   */
  public function register(
    GuardAuthenticatorHandler $guardHandler,
    Request $request,
    Mailer $mailer,
    UserManager $userManager
  ): Response {
    // create the registration form
    $user = $userManager->createUser();
    $registrationForm = $this->createForm(UserRegisterType::class, $user);

    // handle the registration form
    $registrationForm->handleRequest($request);
    if ($registrationForm->isSubmitted() && $registrationForm->isValid()) {
      // encode the password and save the (unverified) user to the database
      $userManager->setEncodedPassword($user, $user->getPassword());
      $userManager->saveUser($user);

      // send the verification email
      $mailer->sendVerificationEmail($user);

      // initialise the twig variables
      $twigs = [
        'email' => $user->getEmail()
      ];

      // render and return the page
      return $this->render('security/verify.html.twig', $twigs);
    }

    // initialise the twig variables
    $twigs = [
      'registrationForm' => $registrationForm->createView()
    ];

    // render and return the page
    return $this->render('security/register.html.twig', $twigs);
  }

  /**
   * Route for user's who have not yet verified their account.
   *
   * @Route("/unverified", name="unverified")
   * @return Response
   */
  public function notVerified(): Response
  {
    // render and return the page
    return $this->render('security/unverified.html.twig');
  }

  /**
   * Route for verifying an email address.
   *
   * @Route("/verify/{user}/{token}", name="verify")
   * @param GuardAuthenticatorHandler $guardHandler
   * @param Request $request
   * @param LoginFormAuthenticator $loginFormAuthenticator
   * @param UserManager $userManager
   * @param User $user
   * @param string $token
   * @return Response
   */
  public function verify(
    GuardAuthenticatorHandler $guardHandler,
    Request $request,
    LoginFormAuthenticator $loginFormAuthenticator,
    UserManager $userManager,
    User $user,
    string $token
  ): Response {
    // check the token matches the user account
    if ($token !== $user->getToken()) {
      throw $this->createNotFoundException('Page not found.');
    }

    // if the user is not yet verified, verify them and add a flash message
    if (!$user->isVerified()) {
      $user->setVerified(true);
      $userManager->saveUser($user);
      $this->addFlash('success', 'Your email address has been verified.');
    }

    // either way, authenticate the user and redirect
    return $guardHandler->authenticateUserAndHandleSuccess($user, $request, $loginFormAuthenticator, 'main');
  }

  /**
   * Route for requesting forgotten credentials.
   *
   * @Route("/forgot", name="forgot")
   * @param Request $request
   * @param UserManager $userManager
   * @return Response
   */
  public function forgot(Request $request, Mailer $mailer, UserManager $userManager): Response
  {
    // create the email credentials form
    $emailCredentials = new EmailCredentials();
    $emailCredentialsForm = $this->createForm(EmailCredentialsType::class, $emailCredentials);

    // handle the email credentials form
    $emailCredentialsForm->handleRequest($request);
    if ($emailCredentialsForm->isSubmitted() && $emailCredentialsForm->isValid()) {
      $email = $emailCredentials->getEmail();
      $user = $userManager->getUserByEmail($email);
      if ($user) {
        $userManager->setRandomToken($user);
        $userManager->refreshUser($user);
        $mailer->sendCredentialsEmail($user);
        $this->addFlash('success', "An email has been sent to $email with further instructions.");
      } else {
        $emailCredentialsForm->get('email')->addError(new FormError('Email address not found'));
      }
    }

    // set the twig variables
    $twigs = [
      'emailCredentialsForm' => $emailCredentialsForm->createView()
    ];

    // render and return the page
    return $this->render('security/forgot.html.twig', $twigs);
  }

  /**
   * Route for resetting a password.
   *
   * @Route("/reset/{user}/{token}", name="reset")
   * @param Request $request
   * @param UserManager $userManager
   * @param User $user
   * @param string $token
   * @return Response
   */
  public function reset(
    Request $request,
    UserManager $userManager,
    User $user,
    string $token
  ): Response {
    // check the token matches the user account
    if ($token !== $user->getToken()) {
      throw $this->createNotFoundException('Page not found.');
    }

    // check the token isn't more than a day old
    $now = new \DateTime();
    $differenceInDays = (int) $now->diff($user->getTokenDate())->format('%R%a');
    if ($differenceInDays > 1) {
      throw $this->createNotFoundException('This link has expired.');
    }

    // create the reset password form
    $resetPassword = new ResetPassword();
    $resetPasswordForm = $this->createForm(ResetPasswordType::class, $resetPassword);

    // handle the reset password form
    $resetPasswordForm->handleRequest($request);
    if ($resetPasswordForm->isSubmitted() && $resetPasswordForm->isValid()) {
      $userManager->setEncodedPassword($user, $resetPassword->getPassword());
    }

    // set the twig variables
    $twigs = [
      'resetPasswordForm' => $resetPasswordForm->createView()
    ];

    // render and return the page
    return $this->render('security/reset.html.twig', $twigs);
  }

  /**
   * Route for returning the current user status (used by the JS app).
   *
   * @Route("/status", name="status")
   * @param Request $request
   * @param SerializerInterface $serializer
   * @return JsonResponse
   */
  public function status(Request $request, SerializerInterface $serializer): Response
  {
    if ($this->getUser()) {
      return new Response($serializer->serialize($this->getUser(), 'json', ['groups' => 'json']));
    } else {
      return new Response('null');
    }
  }
}
