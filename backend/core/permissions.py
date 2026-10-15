from rest_framework.permissions import IsAuthenticated


class IsCustomer(IsAuthenticated):
    """Signed-in shoppers only: staff accounts manage the store but never buy."""

    message = "Las cuentas de administrador no pueden realizar compras."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return not request.user.is_staff
