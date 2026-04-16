from pydantic import BaseModel, Field


class ItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Hammer"])
    description: str | None = Field(default=None, examples=["A useful tool"])
    price: float = Field(..., gt=0, examples=[9.99])


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)


class Item(ItemBase):
    id: int

    model_config = {"from_attributes": True}
