from dynamic_rest.serializers import DynamicModelSerializer, DynamicRelationField
from rest_framework.serializers import JSONField
from dynamic_rest.viewsets import DynamicModelViewSet
from exampleapp.models import Author, Comment, Post, Tag


def update_instance(instance, validated_data):
    for attr, value in validated_data.items():
        setattr(instance, attr, value)
    instance.save()


class TagSerializer(DynamicModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "parent", "published")


class AuthorSerializer(DynamicModelSerializer):
    model = Author

    class Meta:
        model = Author
        fields = ("id", "name", "email")


class CommentSerializer(DynamicModelSerializer):
    author = AuthorSerializer(many=False)

    class Meta:
        model = Comment
        fields = ("id", "post", "body", "created_at", "author")

    def create(self, validated_data):
        author_data = validated_data.pop("author")
        author = Author.objects.create(**author_data)
        comment = Comment.objects.create(author=author, **validated_data)
        return comment

    def update(self, instance, validated_data):
        update_instance(instance.author, validated_data.pop("author"))
        update_instance(instance, validated_data)
        return instance


class TagRelatedField(DynamicRelationField):

    def get_queryset(self):
        return super().get_queryset()


class PostSerializer(DynamicModelSerializer):
    tags = TagRelatedField(many=True, queryset=Tag.objects.all(), required=False, serializer_class = TagSerializer)
    backlinks = JSONField(required=False)
    notifications = JSONField(required=False)
    authors = JSONField(required=False)

    class Meta:
        model = Post
        fields = (
            "id",
            "title",
            "teaser",
            "body",
            "views",
            "average_note",
            "commentable",
            "published_at",
            "category",
            "subcategory",
            "tags",
            "backlinks",
            "notifications",
            "authors",
        )


class TagViewSet(DynamicModelViewSet):
    model = Tag
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class PostViewSet(DynamicModelViewSet):
    model = Post
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    search_fields = ["title", "teaser", "body"]


class CommentViewSet(DynamicModelViewSet):
    model = Comment
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    filterset_fields = ["post"]
    search_fields = ["body"]


class UserViewSet(DynamicModelViewSet):
    model = Author
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    search_fields = ["name"]
