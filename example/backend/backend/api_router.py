from dynamic_rest.routers import DynamicRouter
from exampleapp.api import TagViewSet, PostViewSet, CommentViewSet, UserViewSet


router = DynamicRouter()

router.register("tags", TagViewSet)
router.register("posts", PostViewSet)
router.register("comments", CommentViewSet)
router.register("users", UserViewSet)


app_name = "api"
