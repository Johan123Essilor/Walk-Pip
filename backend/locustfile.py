from locust import HttpUser, task, between

USER_EMAIL = "prueba@gmail.com"

class FullSystemTest(HttpUser):
    wait_time = between(1, 3)

    # ===============================
    # USERS MODULE
    # ===============================

    # @task
    # def users_login(self):
    #     self.client.post("/users/login/", {
    #         "correo": USER_EMAIL,
    #         "contrasena": "123456"
    #     })

    # @task
    # def users_register(self):
    #     self.client.post("/users/register/", {
    #         "nombre": "LocustUser",
    #         "correo": "locust_user@example.com",
    #         "contrasena": "123456"
    #     })

    @task
    def users_sync_auth0(self):
        self.client.post("/users/auth0/sync/", {
            "sub": "auth0|locust123",
            "email": USER_EMAIL,
            "name": "Load Tester",
            "picture": ""
        })

    @task
    def users_listar_usuarios(self):
        self.client.get("/users/")

    @task
    def users_perfil_get(self):
        self.client.post("/users/perfil/mi_perfil/", {
            "user_email": USER_EMAIL
            })

    # ------------------------------
    # REVIEWS
    # ------------------------------

    @task
    def users_reviews_list(self):
        self.client.get("/users/reviews/")

    # @task
    # def users_reviews_create(self):
    #     self.client.post("/users/reviews/", {
    #         "ruta": 1,
    #         "puntuacion": 4,
    #         "estado": "completado",
    #         "user_email": USER_EMAIL,
    #         "comentario": "Prueba de rendimiento!",
    #         "calificacion": 5
    #     })

    @task
    def users_reviews_mis_reviews(self):
        self.client.post("/users/reviews/mis_reviews/", {
            "user_email": USER_EMAIL
        })

    # ------------------------------
    # CONDICIONES
    # ------------------------------

    @task
    def users_condiciones_list(self):
        self.client.get("/users/condicion/")

    # ------------------------------
    # SALUD
    # ------------------------------

    # @task
    # def users_salud_get(self):
    #     self.client.get(f"/users/salud/?user_email={USER_EMAIL}")

    # @task
    # def users_salud_post(self):
    #     self.client.post("/users/salud/", {
    #         "user_email": USER_EMAIL,
    #         "peso": 70,
    #         "altura": 170,
    #         "presion": "120/80"
    #     })

    # ------------------------------
    # CONTACTO EMERGENCIA
    # ------------------------------

    @task
    def users_contacto_get(self):
        self.client.get(f"/users/contacto-emergencia/?user_email={11}")

    # @task
    # def users_contacto_create(self):
    #     self.client.post(f"/users/contacto-emergencia/?user_email={USER_EMAIL}", {
    #         "usuario": 11,
    #         "nombre_contacto": "Maria",
    #         "correo": "maria@example.com",
    #         "parentesco": "Hermana"
    #     })

    # ------------------------------
    # HORARIO RETORNO
    # ------------------------------

    @task
    def users_horarios_get(self):
        self.client.get(f"/users/horario-retorno/?user_email={USER_EMAIL}")

    # @task
    # def users_horarios_create(self):
    #     self.client.post("/users/horario-retorno/", {
    #         "user_email": USER_EMAIL,
    #         "contacto": 4,
    #         "hora_inicio": "09:00",
    #         "hora_retorno": "12:00",
    #         "cita": 1
    #     })


    # ===============================
    # TRAIL MODULE
    # ===============================

    @task
    def trail_usuarios(self):
        self.client.get("/trail/usuarios/todos/")

    # ----------- CITAS -----------

    @task
    def trail_citas_list(self):
        self.client.get("/trail/agendar/")

    # @task
    # def trail_citas_create(self):
    #     self.client.post("/trail/agendar/", {
    #         "user_email": USER_EMAIL,
    #         "fecha_visita": "2025-12-01",
    #         "clima": "soleado",
    #         "recomendaciones": "Llevar agua",
    #         "compania": 7,
    #         "ruta": 1
    #     })


    @task
    def trail_citas_mis_amigos(self):
        self.client.get(f"/trail/agendar/mis-amigos/?user_email={USER_EMAIL}")

    # ----------- HISTORIAL -----------

    @task
    def trail_historial(self):
        self.client.get(f"/trail/historial-rutas/mi-historial/?user_email={USER_EMAIL}")

    # @task
    # def trail_historial_update(self):
    #     self.client.patch("/trail/historial-rutas/1/", {
    #         "user_email": USER_EMAIL,
    #         "resultado": "completado",
    #         "satisfaccion": "buena"
    #     })

    # ----------- RUTAS -----------

    @task
    def trail_rutas_list(self):
        self.client.get("/trail/rutas/")

    # ===============================
    # GROUPS MODULE
    # ===============================

    @task
    def groups_list(self):
        self.client.get(f"/groups/grupos/?user_email={USER_EMAIL}")

    @task
    def groups_create(self):
        self.client.post("/groups/grupos/", {
            "user_email": USER_EMAIL,
            "nombre": "Grupo Locust",
            "descripcion": "Grupo de prueba con Locust265445"
        })


    @task
    def groups_members(self):
        self.client.post("/groups/grupos/7/members/", {
            "user_email": USER_EMAIL
        })

    # @task
    # def groups_invite_multiple(self):
    #     self.client.post("/groups/grupos/7/invite-multiple/", {
    #         "user_email": USER_EMAIL,
    #         "usuarios_ids": [2],
    #         "rol": "Miembro"
    #     })

    @task
    def groups_pending(self):
        self.client.post("/groups/grupos/pending_invitations/", {
            "user_email": USER_EMAIL
        })

    # @task
    # def groups_accept(self):
    #     self.client.post("/groups/grupos/7/accept_invitation/", {
    #         "user_email": USER_EMAIL
    #     })

    # @task
    # def groups_reject(self):
    #     self.client.post("/groups/grupo/1/reject_invitation/", {
    #         "user_email": USER_EMAIL
    #     })

    # @task
    # def groups_leave(self):
    #     self.client.post("/groups/grupo/1/leave/", {
    #         "user_email": USER_EMAIL
    #     })

    # @task
    # def groups_schedule_activity(self):
    #     self.client.post("/groups/grupo/1/schedule_activity/", {
    #         "user_email": USER_EMAIL,
    #         "actividad": "Caminata grupal",
    #         "fecha": "2025-12-10"
    #     })

    # @task
    # def groups_group_pending(self):
    #     self.client.post("/groups/grupo/1/group_pending_invitations/", {
    #         "user_email": USER_EMAIL
    #     })

    # @task
    # def groups_transfer_ownership(self):
    #     self.client.post("/groups/grupo/1/transfer_ownership/", {
    #         "user_email": USER_EMAIL,
    #         "nuevo_creador_id": 2
    #     })
